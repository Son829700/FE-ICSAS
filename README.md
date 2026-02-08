# FE-ICSAS  
**Internal Control & Analytics System**

Frontend cho hệ thống **Business Intelligence & Access Control** phục vụ phân tích dữ liệu thương mại điện tử, được phát triển trong khuôn khổ **Capstone Project – Semester 9**.

---

## 📌 Project Overview

Trong lĩnh vực **e-commerce**, doanh nghiệp tạo ra khối lượng lớn dữ liệu từ đơn hàng, thanh toán, đánh giá sản phẩm và hành vi người dùng. Tuy nhiên, dữ liệu thường:

- Phân tán ở nhiều **relational tables**
- Thiếu **centralized data storage**
- Tổng hợp thủ công, dễ gây **data inconsistency**
- Báo cáo mang tính mô tả, thiếu insight chuyên sâu
- Chưa có cơ chế **access control** rõ ràng khi chia sẻ dashboard nội bộ

Dự án này xây dựng một **end-to-end Business Intelligence System**, trong đó **FE-ICSAS** đóng vai trò là **internal web application** để truy cập và quản lý dashboard phân tích dữ liệu.

---

## 🏢 Business Context

**Company:** Olist (Brazil)  
**Dataset:** https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce  

**Olist** là nền tảng e-commerce hỗ trợ các **SMEs** bán hàng trên nhiều marketplace (Mercado Livre, Amazon Brazil, …), cung cấp giải pháp quản lý đơn hàng, tồn kho và vận chuyển tập trung.

---

## 🎯 Project Objectives

- Chuẩn hóa dữ liệu từ các hệ thống nghiệp vụ
- Xây dựng **centralized tables** phục vụ phân tích
- Cung cấp **interactive dashboards** cho các phòng ban
- Kiểm soát quyền truy cập dữ liệu thông qua **role-based access control**
- Mô phỏng quy trình triển khai **data analytics system** trong môi trường doanh nghiệp thực tế

---

## 🧩 System Architecture (High-level)

- **Data Pipeline & Orchestration:** Airflow
- **Centralized Storage:** PostgreSQL
- **BI Dashboard:** Looker Studio
- **Internal Web (This Repo):**
  - Embed Looker Studio dashboards
  - Quản lý user, group, ticket và access control
- **Deployment:** Docker, AWS EC2, Vercel (Frontend)

---

## 🖥️ Frontend Scope (FE-ICSAS)

FE-ICSAS là **internal web application** phục vụ nhân viên nội bộ, bao gồm:

- Dashboard portal (embed Looker Studio)
- User & Group Management
- Ticket xin quyền truy cập dashboard
- Role-based access control
- Monitoring & log visualization (UI level)

---

## 🧑‍💼 Business Roles & Access Control

### 1. System Administrator
**Responsibilities**
- User Management
- System log management
- Log Monitoring Dashboard
- Cấu hình tham số hệ thống
- Đảm bảo an toàn & ổn định hệ thống

---

### 2. BI Developer (Web Owner)
**Responsibilities**
- Xây dựng pipeline ETL & centralized tables
- Thiết kế và quản lý dashboards
- Quản lý group người dùng:
  - Traditional Groups (theo phòng ban)
  - Ad-hoc Groups (theo dự án, vai trò)
- Quản lý ticket xin quyền truy cập
- Cấp quyền dashboard theo group
- Giám sát hệ thống thông qua monitoring dashboard

**Example**
- Nhóm *Marketing* được cấp dashboard A, B, C  
- Nhân viên mới → thêm vào nhóm *Marketing* → tự động có quyền truy cập

---

### 3. Other Departments (End Users)

#### 3.1. Manager (Head of Department)
**Responsibilities**
- Phê duyệt / từ chối ticket xin quyền truy cập
- Truy cập dashboard cấp cao
- Trung gian giữa nhân viên và BI team

#### 3.2. Staff
**Responsibilities**
- Tạo ticket xin quyền truy cập dashboard
- Sử dụng dashboard cấp thấp
- Chỉ truy cập sau khi:
  - Manager phê duyệt
  - BI Developer cấp quyền chính thức

---

## 🛠️ Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- TailAdmin (UI Template – customized)

### Others (System-wide)
- PostgreSQL
- Apache Airflow
- Looker Studio
- Docker
- AWS EC2

---

## 🚀 Getting Started (Frontend)

### Prerequisites
- Node.js 18+

### Installation
```bash
npm install
