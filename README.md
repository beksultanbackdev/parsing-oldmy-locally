# SDU Course Data Parser

This project contains a Node.js backend to parse course and syllabus data from the SDU student portal (`my.sdu.edu.kz`). The collected data is stored in a MongoDB database.

## Features

- Parses elective courses and main curriculum courses.
- Extracts detailed syllabus information for each course with robust error handling.
- Stores data in three separate MongoDB collections: `courses`, `curriculumcourses`, and `syllabuses`.
- Calculates the total sum of credits from string values (e.g., "2 + 2 + 2" becomes 6).

## Project Structure

```
local-parsing-oldmy/
├── backend/
│   ├── controllers/      # API logic
│   ├── models/           # Mongoose schemas
│   ├── parser/           # The main parsing script
│   ├── routes/           # API routes
│   └── server.js         # Express server entry point
├── .env                  # Environment variables (MUST BE CREATED)
├── .env.example          # Example environment file
└── package.json
```

## Setup and Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running.

### 2. Clone the Repository

```bash
git clone <repository-url>
cd local-parsing-oldmy
```

### 3. Install Dependencies

Navigate to the `backend` directory and install the required npm packages.

```bash
cd backend
npm install
```

### 4. Configure Environment Variables

1.  Create a copy of the `.env.example` file in the root directory and name it `.env`.
2.  Open the `.env` file and fill in the required values:

    ```
    # MongoDB Connection URL
    MONGO_URI=mongodb://localhost:27017/YourDatabaseName

    # SDU Portal Authentication Cookie
    # 1. Log in to my.sdu.edu.kz in your browser.
    # 2. Open the developer tools (F12).
    # 3. Go to the 'Application' (or 'Storage') tab.
    # 4. Find the 'Cookies' section and select the my.sdu.edu.kz domain.
    # 5. Copy the value of the 'PHPSESSID' cookie and paste it here.
    SDU_COOKIE_PHPSESSID="YOUR_PHPSESSID_COOKIE_VALUE"
    ```

## Usage

### Running the Parser

To start the data parsing process, run the following command from the `backend` directory:

```bash
npm run parse
```

This script will:
1.  Connect to your MongoDB database.
2.  Authenticate to the SDU portal using your session cookie.
3.  Parse all curriculum and elective courses.
4.  Parse the syllabus for every course found.
5.  Save the data into the `courses`, `curriculumcourses`, and `syllabuses` collections.

**Note:** The full parsing process can take a significant amount of time (10-30 minutes).

### Starting the API Server

To start the Express API server, run the following command from the `backend` directory:

```bash
npm start
```

The server will start on the port defined in `backend/server.js` (default is 5000).

### API Endpoints

#### Start Parsing via API

- **URL**: `/api/courses/parse`
- **Method**: `POST`
- **Body**: `{"cookie": "YOUR_PHPSESSID_COOKIE_VALUE"}`

This endpoint allows you to trigger the parsing process by sending a POST request with your `PHPSESSID` cookie in the body. The server will immediately respond with a `202 Accepted` status and start the parsing in the background.

**Example using cURL:**

```bash
curl -X POST http://localhost:5000/api/courses/parse \
-H "Content-Type: application/json" \
-d '{"cookie": "your_actual_php_session_id"}'
```

## Containerization with Paketo Buildpacks

This project can be containerized using [Paketo Buildpacks](https://paketo.io/) without needing a `Dockerfile`.

### 1. Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed and running.
- [`pack` CLI](https://buildpacks.io/docs/install-pack/) installed.

### 2. Build the Docker Image

Run the following command from the **root directory** of the project:

```bash
npm run build:docker
```

This command uses Paketo to build a Docker image named `sdu-parser-app` from the code in the `backend` directory.

### 3. Run the Docker Container

To run the application, you need to provide the `MONGO_URI` as an environment variable to the container. The `SDU_COOKIE_PHPSESSID` is not needed for the container itself, as it will be passed via the API.

```bash
docker run --rm -p 5000:5000 -e MONGO_URI="mongodb://host.docker.internal:27017/YourDatabaseName" --name sdu-parser sdu-parser-app
```

**Explanation:**
- `--rm`: Automatically removes the container when it exits.
- `-p 5000:5000`: Maps port 5000 of the container to port 5000 on your local machine.
- `-e MONGO_URI=...`: Sets the MongoDB connection string. `host.docker.internal` is a special DNS name that allows the container to connect to services running on your host machine (like your local MongoDB).
- `--name sdu-parser`: Assigns a name to the running container.
- `sdu-parser-app`: The name of the image to run.

After running this command, the API server will be accessible at `http://localhost:5000`, and you can use the `/api/courses/parse` endpoint as described above.
