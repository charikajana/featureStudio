# 📘 BDD Feature File Editor -- On-Prem Enterprise Application

## 📌 Purpose

Build a **web-based BDD feature file editor** hosted on an **on-prem
Linux system**, where users can:

-   Write and edit **Cucumber `.feature` files**
-   Automatically see **all feature folders & files**
-   Get **auto-suggestions** while writing
-   Create **new feature files using a guided UI**
-   Work with **GitHub repositories**
-   Push changes safely using **auto-created branches**
-   Never push directly to main/develop
-   Work securely without exposing Git credentials
-   Scale for enterprise teams

This application must be **production-ready**, **secure**, and **fully
offline capable**.

------------------------------------------------------------------------

## 🎯 Core Functional Requirements (MANDATORY)

### 1️⃣ User Access

-   Users log in via:
    -   LDAP / Active Directory **OR**
    -   Local authentication (username/password)
-   Each user has an **isolated workspace**

------------------------------------------------------------------------

### 2️⃣ Git Repository Handling

-   User provides:
    -   GitHub repository URL
    -   GitHub **Personal Access Token (PAT)**
-   Repository is **cloned only once per user**
-   On subsequent logins:
    -   Repo is reused
    -   **No re-clone**
-   Git credentials are:
    -   Stored **encrypted**
    -   Never exposed to frontend

------------------------------------------------------------------------

### 3️⃣ File System Rules

-   Only `.feature` files are editable
-   Feature folders are:
    -   **Automatically discovered**
    -   No hardcoded paths
-   Folder is considered a feature folder if:
    -   It contains `.feature` files
    -   OR has subfolders containing `.feature` files
-   `.git`, `target`, `node_modules`, `build` must be hidden

------------------------------------------------------------------------

### 4️⃣ Feature File Visibility (Project Area)

-   Project Area must show:
    -   Only feature-related folders/files
    -   Exact directory hierarchy from repo
-   No manual configuration
-   Automatically refreshed on:
    -   Repo clone
    -   File save
    -   Git pull
    -   New feature file creation

------------------------------------------------------------------------

### 5️⃣ Feature File Editing

-   Web-based editor
-   Gherkin syntax highlighting
-   Read/write support
-   File save writes directly to local repo

------------------------------------------------------------------------

## 🆕 6️⃣ Create New Feature File (MANDATORY)

### 📌 User Interface Requirement

The Project Area must have a **"+ New Feature File"** button.

### 🧭 Create Feature File -- User Flow

When user clicks **"New Feature File"**, the application must open a
**guided modal / wizard** with the following **mandatory questions**:

#### Step 1: Select Folder

-   Display **only auto-detected feature folders**
-   User selects:
    -   Existing feature folder\
    -   OR creates a **new folder** (optional)

#### Step 2: Feature Name

-   User enters feature name (e.g., `User Login`)
-   System converts it to `user_login.feature`
-   Validation:
    -   No duplicate file name
    -   `.feature` extension enforced

#### Step 3: Tags

-   Optional tags:
    -   `@smoke`, `@regression`, `@login`
-   Auto-prefix `@` if missing

#### Step 4: Create

-   Create file with boilerplate content

``` gherkin
@smoke @login
Feature: User Login

  Scenario: Verify user login
    Given
    When
    Then
```

------------------------------------------------------------------------

## 7️⃣ Git Push Strategy (CRITICAL)

-   **Every push must create a new branch**
-   Branch naming:

```{=html}
<!-- -->
```
    feature/{username}/{yyyyMMdd-HHmmss}

-   Never push to `main` or `develop`
-   Optional PR creation

------------------------------------------------------------------------

## ✨ Auto-Suggestion Requirements

-   Gherkin keywords
-   Existing step definitions
-   Reuse from other feature files
-   Context-aware suggestions
-   Optional AI suggestions via **Ollama**

------------------------------------------------------------------------

## 🏗️ Final Tech Stack

### Hosting

-   Ubuntu 22.04 LTS
-   Docker + Docker Compose
-   Nginx

### Frontend

-   React + TypeScript
-   Monaco Editor
-   MUI / Ant Design

### Backend

-   Java 17
-   Spring Boot 3
-   Spring Security
-   JGit + Git CLI
-   Cucumber / Gherkin

### Database

-   PostgreSQL
-   Encrypted credentials

### AI (Optional)

-   Ollama
-   Mistral / LLaMA 3

------------------------------------------------------------------------

## 📁 Folder Structure

    /data/workspaces/
     └── {user}/
          └── {project}/
               └── features/

------------------------------------------------------------------------

## 🔐 Security Rules

-   Backend-only Git access
-   Encrypted tokens
-   `.feature` files only
-   Audit logging

------------------------------------------------------------------------

## 🏁 FINAL NOTE

This README fully defines the system and is **ready for immediate
implementation without further clarification**.
