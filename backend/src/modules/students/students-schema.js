const { z } = require("zod");

const GetStudentsSchema = z.object({
  query: z.object({
    name: z.string().optional(),
    class: z.string().optional(),
    section: z.string().optional(),
    roll: z.string().regex(/^\d+$/, "Roll must be a positive integer").optional()
  })
});

const AddStudentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.string().email("Invalid email format").max(100, "Email is too long"),
    gender: z.enum(["Male", "Female", "Other"], {
      errorMap: () => ({ message: "Gender must be Male, Female, or Other" })
    }).optional(),
    phone: z.string().max(20, "Phone number is too long").optional(),
    dob: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "Invalid date of birth format"
    }).optional(),
    currentAddress: z.string().max(200, "Current address is too long").optional(),
    permanentAddress: z.string().max(200, "Permanent address is too long").optional(),
    fatherName: z.string().max(100, "Father's name is too long").optional(),
    fatherPhone: z.string().max(20, "Father's phone is too long").optional(),
    motherName: z.string().max(100, "Mother's name is too long").optional(),
    motherPhone: z.string().max(20, "Mother's phone is too long").optional(),
    guardianName: z.string().max(100, "Guardian's name is too long").optional(),
    guardianPhone: z.string().max(20, "Guardian's phone is too long").optional(),
    relationOfGuardian: z.string().max(50, "Relation is too long").optional(),
    systemAccess: z.boolean().optional(),
    class: z.string().min(1, "Class is required").max(50, "Class is too long"),
    section: z.string().min(1, "Section is required").max(50, "Section is too long"),
    admissionDate: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "Invalid admission date format"
    }),
    roll: z.number({ required_error: "Roll number is required", invalid_type_error: "Roll number must be a number" }).int("Roll must be an integer").positive("Roll number must be positive")
  })
});

const UpdateStudentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Student ID must be a positive integer")
  }),
  body: AddStudentSchema.shape.body
});

const GetStudentDetailSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Student ID must be a positive integer")
  })
});

const StudentStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Student ID must be a positive integer")
  }),
  body: z.object({
    status: z.boolean({ required_error: "Status must be a boolean" })
  })
});

module.exports = {
  GetStudentsSchema,
  AddStudentSchema,
  UpdateStudentSchema,
  GetStudentDetailSchema,
  StudentStatusSchema
};
