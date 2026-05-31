const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent } = require("./students-service");

// GET /api/v1/students?name=&className=&section=&roll=
const handleGetAllStudents = asyncHandler(async (req, res) => {
    //write your code
    const { name, className, section, roll } = req.query;
        const students = await getAllStudents({ name, className, section, roll });
        res.json({ students });
    });

// POST /api/v1/students
const handleAddStudent = asyncHandler(async (req, res) => {
    //write your code
     const payload = req.body;
        const message = await addNewStudent(payload);
        res.json(message);

});

// PUT /api/v1/students/:id
const handleUpdateStudent = asyncHandler(async (req, res) => {
    //write your code
     const { id } = req.params;
        const payload = req.body;
        const message = await updateStudent({ ...payload, id });
        res.json(message);
});

// GET /api/v1/students/:id
const handleGetStudentDetail = asyncHandler(async (req, res) => {
    //write your code
     const { id } = req.params;
        const student = await getStudentDetail(id);
        res.json({ student });
});

// POST /api/v1/students/:id/status
const handleStudentStatus = asyncHandler(async (req, res) => {
    //write your code
    const { id: userId } = req.params;
    const { id: reviewerId } = req.user;
    const { status } = req.body;
    const message = await setStudentStatus({ userId, reviewerId, status });
    res.json(message);

});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
};
