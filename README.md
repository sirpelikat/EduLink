# 🎓 EduLink – School Management System

EduLink is a comprehensive school management platform designed to bridge the gap between **teachers, parents, students, counselors, and administrators**. It delivers real-time insights, seamless communication, and automated reporting to enhance the overall educational experience.

---

## 🚀 Key Features

EduLink implements a **role-based access control system** with four distinct user roles:

* **Admin**
* **Teacher**
* **Parent**
* **Counselor**

Each role receives a tailored interface and access to relevant features only.

---

## 📊 Dashboard

* **Role-Specific Views**
  Personalized dashboards for each role
  *(e.g., “My Family” for parents, “Class Overview” for teachers)*

* **Announcement Carousel**
  Interactive slider displaying school-wide or class-specific announcements

* **Performance Metrics**
  Visual charts powered by **Recharts** showing:

  * Subject averages
  * Attendance trends

* **Risk Monitoring**
  Automated detection of students at risk based on attendance and academic performance

---

## 📝 Academic Reports

* **Digital Report Cards**
  View and manage academic performance for **Term 1** and **Term 2**

* **Automated Grading System**

  * Subject breakdown
  * Letter grading (A–F)
  * Class & year ranking calculations

* **E-Signatures**
  Parents can digitally sign report cards to acknowledge receipt

* **Teacher Tools**
  Teachers can:

  * Enter and edit marks
  * Record attendance
  * Add behavioral remarks

---

## 📢 Announcements

* **Targeted Communication**
  Publish announcements for:

  * The entire school
  * Specific classes only

* **Content Management**
  Admins and teachers can:

  * Create
  * Edit
  * Delete announcements

* **Search & Filter**
  Real-time search to quickly locate past announcements

---

## ❤️ Well-being Monitor

* **Early Warning System**
  Intelligent algorithms analyze:

  * Attendance
  * Academic performance
    to flag students as **High Risk** or **Low Risk**

* **Counselor Tools**

  * Track contacted students
  * Log intervention progress and status

* **Trend Analysis**
  Visual indicators showing improvement or decline between academic terms

---

## 🛡️ Admin Portal

* **User Management**
  Create and manage accounts for:

  * Parents
  * Teachers
  * Counselors

* **Student Records**

  * Enroll students
  * Link students to parent accounts

* **Bulk Import**
  CSV upload support for batch creation of users and families

---

## 🛠️ Tech Stack

| Layer        | Technology                                        |
| ------------ | ------------------------------------------------- |
| Frontend     | React 19, Vite                                    |
| Styling      | Tailwind CSS v4                                   |
| Routing      | React Router v7                                   |
| Backend/Auth | Firebase v12 (Authentication & Realtime Database) |
| Charts       | Recharts                                          |
| Icons        | Lucide React                                      |

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/sirpelikat/EduLink.git
cd edulink
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Firebase

1. Create a project in the **Firebase Console**
2. Enable:

   * **Authentication** (Email/Password)
   * **Realtime Database**
3. Update `src/firebaseConfig.js` with your Firebase credentials

### 4️⃣ Run Development Server

```bash
npm run dev
```

### 5️⃣ Build for Production

```bash
npm run build
```

---

## 📂 Project Structure

```plaintext
src/
├── assets/          # Static images (logos, slides)
├── context/         # React Context (AuthContext)
├── pages/           # Main route components
│   ├── Admin.jsx          # User & Student Management
│   ├── Announcements.jsx  # News Feed
│   ├── Dashboard.jsx      # Overview & Charts
│   ├── Login.jsx          # Authentication Page
│   ├── Profile.jsx        # User Profile & Settings
│   ├── Reports.jsx        # Academic Results
│   └── Wellbeing.jsx      # Student Risk Monitoring
├── styles/          # Tailwind & global styles
├── App.jsx          # Main Layout & Routing
└── firebaseRTDB.js  # Database Helper Functions
```

---

## 👤 User Roles & Access

* **Admin**
  Full system access, user management, and school-wide configuration

* **Teacher**
  Manage assigned classes, input grades, and post class announcements

* **Counselor**
  Monitor at-risk students and manage intervention records

* **Parent**
  View children’s academic reports, attendance, and announcements

---

## ©️ Credits

Developed by **Fantastic 404** © 2025
