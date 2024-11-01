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
  SMTP_HOST=<REFER TO CONFLUENCE>
  SMTP_AUTH_USER=<REFER TO CONFLUENCE>
  SMTP_AUTH_PASSWORD=<REFER TO CONFLUENCE>
  ```

- Create the file `.env` at `frontend/.env`
- Enter the following code

  ```
  VITE_BACKEND_URL=//localhost:3001
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

```
https://www.lurence.org/api/v1/docs
```

## Acknowledgements

Developed by G5, Team 7

<a href="https://www.linkedin.com/in/joshydavid/">
  <img src="https://github.com/user-attachments/assets/4dfe0c89-8ced-4e08-bcf3-6261bdbb956d" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/bryancjh/">
  <img src="https://github.com/user-attachments/assets/cc1782b1-e71f-410a-97a4-cfec08bccead" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/derricklkh/">
  <img src="https://github.com/user-attachments/assets/2db4b711-b7d0-4368-8d12-6449c3fa2aa2" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/shawn-ng-yh/">
  <img src="https://github.com/user-attachments/assets/6bd4f3a7-6784-402a-b891-03d91e15d705" width="80">
</a> &nbsp;

<a href="https://www.linkedin.com/in/lucerne-loke/">
  <img src="https://github.com/user-attachments/assets/5687d2d4-477d-4fc3-9854-756b910337c0" width="80">
</a> &nbsp;

<a href="https://github.com/Ttmjzz/">
  <img src="https://github.com/user-attachments/assets/24522f87-6fb8-4b48-94d8-8022eb571e96" width="80">
</a>
