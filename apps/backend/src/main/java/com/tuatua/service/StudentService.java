package com.tuatua.service;

import com.tuatua.dto.RegisterRequest;
import com.tuatua.entity.Student;
import com.tuatua.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    // THÊM CONSTRUCTOR NÀY VÀO
    @Autowired
    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Tạo và gửi lại token xác thực cho một email đã đăng ký nhưng chưa kích hoạt.
     * @param email Email của người dùng.
     * @return Đối tượng Student đã được cập nhật token.
     * @throws IllegalStateException nếu tài khoản không tồn tại hoặc đã được kích hoạt.
     */
    public Student resendVerificationToken(String email) {
        // Tìm sinh viên theo email
        Student student = studentRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy tài khoản với email này."));

        // Kiểm tra xem tài khoản đã được kích hoạt chưa
        if (student.isEnabled()) {
            throw new IllegalStateException("Tài khoản này đã được xác thực.");
        }

        // Tạo token mới và cập nhật thời gian hết hạn
        String newToken = UUID.randomUUID().toString();
        student.setVerificationToken(newToken);
        student.setTokenExpiryDate(LocalDateTime.now().plusMinutes(30));

        // Lưu lại vào database
        return studentRepository.save(student);
    }

    /**
     * Kiểm tra email đã tồn tại và đăng ký một người dùng mới.
     * @param registerRequest Thông tin đăng ký từ DTO.
     * @return Đối tượng Student đã được tạo.
     * @throws IllegalStateException nếu email đã tồn tại.
     */
    public Student registerNewStudent(RegisterRequest registerRequest) {
        if (studentRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new IllegalStateException("Lỗi: Email đã được sử dụng!");
        }

        Student student = new Student();
        student.setName(registerRequest.getName());
        student.setEmail(registerRequest.getEmail());
        student.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        student.setProvider(Student.AuthProvider.LOCAL);
        student.setEnabled(false); // Mặc định là chưa kích hoạt

        String token = UUID.randomUUID().toString();
        student.setVerificationToken(token);
        // Đặt thời gian hết hạn là 60 giây kể từ bây giờ
        student.setTokenExpiryDate(LocalDateTime.now().plusSeconds(30));

        return studentRepository.save(student);
    }

    /**
     * Xác thực tài khoản người dùng dựa trên token.
     * @param token Verification token từ email.
     * @return Optional chứa Student đã được xác thực, hoặc trống nếu token không hợp lệ.
     */
    public Optional<Student> verifyStudent(String token) {
        Optional<Student> studentOpt = studentRepository.findByVerificationToken(token);
        // Kiểm tra token có tồn tại VÀ chưa hết hạn
        if (studentOpt.isPresent() && studentOpt.get().getTokenExpiryDate().isAfter(LocalDateTime.now())) {
            Student student = studentOpt.get();
            student.setEnabled(true);
            student.setVerificationToken(null); // Xóa token sau khi dùng
            student.setTokenExpiryDate(null); // Xóa luôn thời gian hết hạn
            studentRepository.save(student);
            return Optional.of(student);
        }
        return Optional.empty();
    }

    /**
     * Tìm một Student dựa trên email.
     * @param email Email của người dùng.
     * @return Optional chứa Student nếu tìm thấy.
     */
    public Optional<Student> findByEmail(String email) {
        return studentRepository.findByEmail(email);
    }

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