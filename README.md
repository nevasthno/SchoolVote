# SchoolVote

**Empowering students to raise their voices through digital petitions and voting.**

SchoolVote is a modern web application that enables students to create petitions, vote on issues, and participate in school-wide or class-level decision-making. Designed with role-based access and an intuitive interface, it promotes active student engagement and transparent communication.

---

## Key Features

* **Role-Based Access**

  * **Student**: Create petitions, vote on open issues, and comment on proposals.
  * **Teacher**: View all petitions and statistics.

* **Petitions**

  * Students can create petitions targeting a school or specific class.
  * Petitions include title, description, date range, and are visible to relevant participants.

* **Voting System**

  * Support for both single and multiple-choice voting formats.
  * Role-based voting eligibility by class or school level.
  * Automatic vote recording and status tracking (open/closed).

---

## Getting Started

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/SchoolVote.git
   ```

2. **Set Up the Database**

   * Create a MySQL database named `SchoolVoteDB`.
   * Import the SQL schema that includes tables for users, schools, classes, petitions, votes, and comments.
   * Seed the database with:

     * At least 3 schools
     * Classes (e.g., 1A to 11C)
     * Sample users with roles `STUDENT`, `TEACHER`, and `DIRECTOR`

3. **Create `application.properties`**

   Inside `src/main/resources`, add a file named `application.properties`:

   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/schoolvotedb?useSSL=false&serverTimezone=UTC
   spring.datasource.username=root
   spring.datasource.password=YOUR_PASSWORD
   spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
   spring.profiles.active=dev

   spring.jpa.hibernate.ddl-auto=none
   spring.jpa.show-sql=true
   spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

   app.jwt.secret=very-long-secret-key
   app.jwt.expirationMs=3600000
   app.jwt.issuer=school-vote
   ```

   Also, add `application-test.properties` to `src/test/resources`:

   ```properties
   app.jwt.secret=very-long-secret-key
   app.jwt.expiration-ms=3600000
   app.jwt.issuer=school-vote
   ```

4. **Build & Run**

   ```bash
   ./mvnw spring-boot:run
   ```

   or package and run:

---

## Usage

* **Authentication**

  * Login at `/login.html` with JWT-based authentication.
  * Authenticated users access content based on their role.

* **Student Portal**

  * View petitions available for voting.
  * Create new petitions.
  * Cast a vote if eligible.

* **Teacher & Director Dashboard**

  * Accessible at `/teacher.html` or `/director.html`.
  * View all petitions and voting statistics.

---

## API Endpoints


* **User Profile**

  * `GET /api/me` — returns user info (school, class, role)

* **Petitions**

  * `POST /api/createPetition` — create a petition (students only)
  * `GET /api/petitions/user/{userId}` — petitions available for a specific user
  * `POST /api/petitions/{id}/vote` — vote on a petition (students only)
  * `POST /api/petitions/{id}/director` — director approves a petition

* **Voting**

  * `POST /api/createVoting` — create a custom vote
  * `POST /api/voting/{id}/vote` — cast vote on multiple-choice poll
  * `GET /api/voting/{id}` — view voting details
  * `GET /api/voting/{id}/results` — fetch voting results

* **Comments**

  * `POST /api/comments` — add comment to a petition
  * `GET /api/comments/petition/{petitionId}` — view comments for a petition

---

## Tech Stack

* **Backend**: Spring Boot, Spring Security (JWT), Spring Data JPA, MySQL
* **Frontend**: HTML, JavaScript, CSS
* **Authentication**: Coockie

---

## Contributing

We welcome collaboration from other developers, educators, and students:

1. Fork the repository
2. Create a new feature branch
3. Push your changes
4. Open a pull request

---

You need to use coockies
## JWT & Cookies Instructions (Authentication)

SchoolVote uses JWT tokens and stores them in the browser cookies for secure authentication.
How It Works

    Upon login (POST /api/login), the server returns a JWT token.

    The frontend stores this token in a Cookie.

    On every subsequent request, this cookie is automatically included in the Cookie header.

    The backend extracts the JWT from the cookie and authenticates the user.

Implementation Notes

    Token is stored as a cookie, not in localStorage, for better CSRF protection.

    Make sure cookies are sent only over HTTPS:

document.cookie = `token=${jwt}; path=/; secure; samesite=strict`;

On logout, clear the cookie:

    document.cookie = "token=; Max-Age=0; path=/;";

    application.properties Configuration

# Database config
spring.datasource.url=jdbc:mysql://localhost:3306/schoolvote?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.profiles.active=dev

# Hibernate & JPA
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

# SQL initialization
spring.sql.init.mode=never
spring.sql.init.schema-locations=classpath:SchoolVote.sql

# JWT Configuration
app.jwt.secret=
app.jwt.expirationMs=3600000
app.jwt.issuer=school-vote

# HTTPS & SSL config
server.port=8443
server.ssl.key-store=classpath:schoolvote-keystore.p12
server.ssl.key-store-password=your-password-here
server.ssl.key-store-type=PKCS12
server.ssl.key-alias=schoolvote

Creating the SSL Keystore (HTTPS)

To secure your backend with HTTPS on port 8443, generate a keystore using the command below.
1. Generate SSL Keystore

Run this command in the terminal:

keytool -genkeypair ^
  -alias schoolvote ^
  -keyalg RSA ^
  -keysize 2048 ^
  -storetype PKCS12 ^
  -keystore "C:\your\full\path\schoolvote-keystore.p12" ^
  -validity 3650

    Alias: schoolvote

    Validity: 10 years (3650 days)

    You will be prompted to enter:

        Keystore password

        Your name/organization info

        Confirm

        Keep the password safe. You will use it in application.properties.

2. Move the .p12 file

After creation, move the schoolvote-keystore.p12 file into:

src/main/resources

Now the Spring Boot backend will launch on https://127.0.0.1:8443 with HTTPS enabled.

Thank you for using **SchoolVote**. Let's build a more democratic and participatory school community together.
