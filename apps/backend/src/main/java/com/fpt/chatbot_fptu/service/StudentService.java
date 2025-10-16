package com.fpt.chatbot_fptu.service;

import com.fpt.chatbot_fptu.entity.Student;
import com.fpt.chatbot_fptu.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    public Student createStudent(Student student) {
        // Có thể thêm logic kiểm tra dữ liệu trước khi lưu
        return studentRepository.save(student);
    }

    public Optional<Student> updateStudent(Long id, Student studentDetails) {
        return studentRepository.findById(id)
                .map(existingStudent -> {
                    existingStudent.setName(studentDetails.getName());
                    existingStudent.setEmail(studentDetails.getEmail());
                    existingStudent.setMajor(studentDetails.getMajor());
                    existingStudent.setGoals(studentDetails.getGoals());
                    existingStudent.setInterests(studentDetails.getInterests());
                    existingStudent.setGpa(studentDetails.getGpa());
                    existingStudent.setRiskLevel(studentDetails.getRiskLevel());
                    return studentRepository.save(existingStudent);
                });
    }

    public boolean deleteStudent(Long id) {
        if (studentRepository.existsById(id)) {
            studentRepository.deleteById(id);
            return true;
        }
        return false;
    }
}