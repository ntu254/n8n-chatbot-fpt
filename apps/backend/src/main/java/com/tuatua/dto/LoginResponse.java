package com.tuatua.dto;

import com.tuatua.entity.Student;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Student user;
}
