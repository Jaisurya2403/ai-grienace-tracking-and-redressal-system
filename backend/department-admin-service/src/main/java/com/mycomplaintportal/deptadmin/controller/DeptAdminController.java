package com.mycomplaintportal.deptadmin.controller;

import com.mycomplaintportal.deptadmin.entity.AdminAccount;
import com.mycomplaintportal.deptadmin.entity.Department;
import com.mycomplaintportal.deptadmin.service.DeptAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DeptAdminController {

    private final DeptAdminService deptAdminService;

    // DEPARTMENTS
    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(deptAdminService.getAllDepartments());
    }

//    @PostMapping("/departments")
//    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
//        return ResponseEntity.ok(deptAdminService.createDepartment(department));
//    }
    
    @PostMapping("/departments")
    public ResponseEntity<Department> createDepartment(
            @RequestBody Department department) {

        Department created = deptAdminService.createDepartment(department);

        return ResponseEntity
                .status(201)
                .body(created);
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<Department> updateDepartment(@PathVariable("id") String id, @RequestBody Department department) {
        return ResponseEntity.ok(deptAdminService.updateDepartment(id, department));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable("id") String id) {
        deptAdminService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    // ADMINS
    @GetMapping("/admins")
    public ResponseEntity<List<AdminAccount>> getAllAdmins() {
        return ResponseEntity.ok(deptAdminService.getAllAdmins());
    }

    @PostMapping("/admins")
    public ResponseEntity<AdminAccount> createAdmin(@RequestBody java.util.Map<String, Object> payload) {
        String username = payload.containsKey("username") ? payload.get("username").toString() : "Admin";
        String email = payload.containsKey("email") ? payload.get("email").toString() : "";
        String grantLevel = payload.containsKey("grantLevel") ? payload.get("grantLevel").toString() : "Department Admin";
        String password = payload.containsKey("password") ? payload.get("password").toString() : "ksjaisurya";
        String role = (payload.containsKey("role") && payload.get("role") != null && !payload.get("role").toString().isBlank())
                ? payload.get("role").toString()
                : (grantLevel.toLowerCase().contains("super") ? "SUPER_ADMIN" : "DEPARTMENT_ADMIN");

        AdminAccount admin = AdminAccount.builder()
                .username(username)
                .email(email)
                .grantLevel(grantLevel)
                .active(true)
                .build();

        return ResponseEntity.ok(deptAdminService.createAdmin(admin, password, role));
    }

    @PutMapping("/admins/{id}")
    public ResponseEntity<AdminAccount> updateAdmin(@PathVariable("id") String id, @RequestBody AdminAccount admin) {
        return ResponseEntity.ok(deptAdminService.updateAdmin(id, admin));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable("id") String id, @RequestParam(value = "requesterEmail", required = false) String requesterEmail) {
        deptAdminService.deleteAdmin(id, requesterEmail);
        return ResponseEntity.noContent().build();
    }
}
