package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/jung-kurt/gofpdf"
)

// ── Config ─────────────────────────────────────────────────────────────────────

// NODE_API_URL is the base URL of the Node.js backend.
// Override with the NODE_API_URL environment variable.
func nodeAPIURL() string {
	if u := os.Getenv("NODE_API_URL"); u != "" {
		return u
	}
	return "http://localhost:5007"
}

// ── Student struct — mirrors the JSON returned by GET /api/v1/students/:id ────

type Student struct {
	ID               int     `json:"id"`
	Name             string  `json:"name"`
	Email            string  `json:"email"`
	SystemAccess     bool    `json:"systemAccess"`
	Phone            *string `json:"phone"`
	Gender           *string `json:"gender"`
	DOB              *string `json:"dob"`
	Class            *string `json:"class"`
	Section          *string `json:"section"`
	Roll             *string `json:"roll"`
	FatherName       *string `json:"fatherName"`
	FatherPhone      *string `json:"fatherPhone"`
	MotherName       *string `json:"motherName"`
	MotherPhone      *string `json:"motherPhone"`
	GuardianName     *string `json:"guardianName"`
	GuardianPhone    *string `json:"guardianPhone"`
	RelationOfGuardian *string `json:"relationOfGuardian"`
	CurrentAddress   *string `json:"currentAddress"`
	PermanentAddress *string `json:"permanentAddress"`
	AdmissionDate    *string `json:"admissionDate"`
	ReporterName     *string `json:"reporterName"`
}

// safe dereferences a *string — returns empty string if nil
func safe(s *string) string {
	if s == nil {
		return "—"
	}
	return *s
}

// ── Fetch student from Node.js API ─────────────────────────────────────────────

func fetchStudent(studentID string, authToken string) (*Student, error) {
	url := fmt.Sprintf("%s/api/v1/students/%s", nodeAPIURL(), studentID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// Forward the JWT token (Cookie: accessToken=...) so the Node middleware
	// allows the request. The Go service acts as a trusted internal caller.
	if authToken != "" {
		req.Header.Set("Cookie", "accessToken="+authToken)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error calling Node API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("student not found")
	}
	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Node API error %d: %s", resp.StatusCode, string(body))
	}

	var student Student
	if err := json.NewDecoder(resp.Body).Decode(&student); err != nil {
		return nil, fmt.Errorf("error decoding student JSON: %w", err)
	}
	return &student, nil
}

// ── PDF generation ─────────────────────────────────────────────────────────────

func generatePDF(s *Student) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	// ── Header ──
	pdf.SetFillColor(25, 118, 210) // MUI primary blue
	pdf.Rect(0, 0, 210, 30, "F")
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 18)
	pdf.SetXY(15, 8)
	pdf.CellFormat(180, 14, "Student Report", "", 0, "C", false, 0, "")

	pdf.SetFont("Arial", "", 9)
	pdf.SetXY(15, 21)
	pdf.CellFormat(180, 6, fmt.Sprintf("Generated: %s", time.Now().Format("02 Jan 2006, 15:04")), "", 0, "C", false, 0, "")

	pdf.SetTextColor(0, 0, 0)
	pdf.SetY(40)

	// ── Section helper ──
	addSection := func(title string) {
		pdf.SetFont("Arial", "B", 11)
		pdf.SetFillColor(232, 240, 254)
		pdf.SetTextColor(25, 118, 210)
		pdf.CellFormat(180, 8, "  "+title, "", 1, "L", true, 0, "")
		pdf.SetTextColor(0, 0, 0)
		pdf.Ln(1)
	}

	// ── Row helper ──
	rowCount := 0
	addRow := func(label, value string) {
		pdf.SetFont("Arial", "B", 9)
		if rowCount%2 == 0 {
			pdf.SetFillColor(248, 249, 250)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		pdf.CellFormat(60, 7, label, "", 0, "L", true, 0, "")
		pdf.SetFont("Arial", "", 9)
		pdf.CellFormat(120, 7, value, "", 1, "L", true, 0, "")
		rowCount++
	}

	// ── Personal Information ──
	addSection("Personal Information")
	addRow("Student ID", strconv.Itoa(s.ID))
	addRow("Full Name", s.Name)
	addRow("Email", s.Email)
	addRow("Phone", safe(s.Phone))
	addRow("Gender", safe(s.Gender))
	addRow("Date of Birth", safe(s.DOB))
	addRow("System Access", func() string {
		if s.SystemAccess { return "Active" }
		return "Inactive"
	}())
	pdf.Ln(3)

	// ── Academic Information ──
	rowCount = 0
	addSection("Academic Information")
	addRow("Class", safe(s.Class))
	addRow("Section", safe(s.Section))
	addRow("Roll Number", safe(s.Roll))
	addRow("Admission Date", safe(s.AdmissionDate))
	addRow("Assigned To", safe(s.ReporterName))
	pdf.Ln(3)

	// ── Guardian Information ──
	rowCount = 0
	addSection("Guardian Information")
	addRow("Father's Name", safe(s.FatherName))
	addRow("Father's Phone", safe(s.FatherPhone))
	addRow("Mother's Name", safe(s.MotherName))
	addRow("Mother's Phone", safe(s.MotherPhone))
	addRow("Guardian Name", safe(s.GuardianName))
	addRow("Guardian Phone", safe(s.GuardianPhone))
	addRow("Relation", safe(s.RelationOfGuardian))
	pdf.Ln(3)

	// ── Address ──
	rowCount = 0
	addSection("Address")
	addRow("Current Address", safe(s.CurrentAddress))
	addRow("Permanent Address", safe(s.PermanentAddress))

	// ── Footer ──
	pdf.SetY(-20)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(150, 150, 150)
	pdf.CellFormat(180, 10,
		fmt.Sprintf("School Management System  •  Report for Student ID %d", s.ID),
		"", 0, "C", false, 0, "")

	// Write to a temporary file then read back as bytes
	// (gofpdf doesn't support writing directly to []byte)
	tmpFile, err := os.CreateTemp("", "student-report-*.pdf")
	if err != nil {
		return nil, err
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.Close()

	if err := pdf.OutputFileAndClose(tmpFile.Name()); err != nil {
		return nil, err
	}

	return os.ReadFile(tmpFile.Name())
}

// ── HTTP handler ───────────────────────────────────────────────────────────────

//  GET /api/v1/students/:id/report
//
// The client must pass the JWT as a query param or header so the Go service
// can forward it to the Node.js API.
//
//  ?token=<jwt>   (easiest for curl/browser)
//  OR
//  Authorization: Bearer <jwt>

func reportHandler(w http.ResponseWriter, r *http.Request) {
	// Extract student ID from the URL path: /api/v1/students/{id}/report
	// Using stdlib routing (no external router needed):
	// Path structure guaranteed by the mux registration below.
	studentID := r.PathValue("id")
	if studentID == "" {
		http.Error(w, "Missing student ID", http.StatusBadRequest)
		return
	}

	// Get auth token — try query param first, then Authorization header
	token := r.URL.Query().Get("token")
	if token == "" {
		auth := r.Header.Get("Authorization")
		if len(auth) > 7 && auth[:7] == "Bearer " {
			token = auth[7:]
		}
	}

	student, err := fetchStudent(studentID, token)
	if err != nil {
		if err.Error() == "student not found" {
			http.Error(w, "Student not found", http.StatusNotFound)
			return
		}
		log.Printf("Error fetching student %s: %v", studentID, err)
		http.Error(w, "Failed to fetch student data", http.StatusInternalServerError)
		return
	}

	pdfBytes, err := generatePDF(student)
	if err != nil {
		log.Printf("Error generating PDF for student %s: %v", studentID, err)
		http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("student-report-%s.pdf", studentID)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("Content-Length", strconv.Itoa(len(pdfBytes)))
	w.Write(pdfBytes)
	log.Printf("PDF report served for student %s (%d bytes)", studentID, len(pdfBytes))
}

// ── Health check ───────────────────────────────────────────────────────────────

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status":"ok","service":"school-pdf-service"}`))
}

// ── Main ───────────────────────────────────────────────────────────────────────

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "6001"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/students/{id}/report", reportHandler)
	mux.HandleFunc("GET /health", healthHandler)

	log.Printf("Go PDF service listening on :%s", port)
	log.Printf("Node.js backend expected at: %s", nodeAPIURL())

	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
