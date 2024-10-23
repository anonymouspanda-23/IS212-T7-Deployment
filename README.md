# IS212 G5T7 SPM Project

<img src="https://github.com/user-attachments/assets/7328d6de-51fe-48b7-bd0b-6fdc01687a01" alt="g5t7" width="600" />
<br><br>

## Tech Stack

- [React.js](https://react.dev)
- [Refine](https://refine.dev)
- [Chakra UI](https://www.chakra-ui.com)
- [Koa.js](https://koajs.com/)
- [Mongoose](https://mongoosejs.com)
- [MongoDB](https://www.mongodb.com)

## Getting Started

1. Clone the project

   ```
   git clone https://github.com/SMU-IS/IS212-T7
   ```

2. Install dependencies

   ```
   cd frontend
   npm install
   ```

   ```
   cd backend
   npm install
   ```

3. Set up environment variables

- Create the file `.env` at `backend/.env`
- Enter the following code

  ```
  DOMAIN=//localhost:3001
  CONNECTION_STRING=<REFER TO CONFLUENCE>
  MIGRATE_MONGO_URI=<REFER TO CONFLUENCE>
  MIGRATE_MONGO_COLLECTION=migrations
  MIGRATE_CONFIG_PATH=./migrate
  MIGRATE_MIGRATIONS_PATH=./migrations
  MIGRATE_TEMPLATE_PATH=./migrations/template.ts
  MIGRATE_AUTOSYNC=false
  MIGRATE_MODE=development
  ```

4. Run the project in development environment

   ```
   npm run dev
   ```

5. To run test
   ```
   cd backend
   npm run test
   ```
   
## API Documentation
`https://www.lurence.org/api/v1/docs`

## Acknowledgements

Developed by G5, Team 7
