# 02 — MongoDB Atlas Setup

## What This Is
Manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What You Will Do
- Create a MongoDB Atlas account
- Create a free cluster
- Create a database user
- Whitelist your IP address
- Get the connection string
- Add it to your .env file

---

## Step 1 — Create MongoDB Atlas Account
1. Go to mongodb.com/atlas
2. Click Try Free
3. Sign up with email or Google account
4. Verify your email
5. You will be taken to the Atlas dashboard

---

## Step 2 — Create a Free Cluster
1. On the Atlas dashboard click **Build a Database**
2. Select **M0 Free** tier (the free one)
3. Choose a cloud provider:
   - Select **AWS**
4. Choose a region:
   - Select the closest one to India
   - Recommended: **Mumbai (ap-south-1)**
5. Cluster name: leave as default (`Cluster0`) or rename to `ptepath-cluster`
6. Click **Create Deployment**

Wait 1–3 minutes for the cluster to be created.

---

## Step 3 — Create a Database User
While the cluster is being created, Atlas will ask you to create a user:

1. Username: `ptepath-admin` (or any name you prefer)
2. Password: generate a strong password — **copy and save this somewhere safe**
3. Click **Create User**

> Important: Save this username and password. You will need them in the connection string.

---

## Step 4 — Set Up Network Access (IP Whitelist)
1. In the left sidebar click **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere**
   - This adds `0.0.0.0/0`
   - This is fine for development and for Render hosting (Render uses dynamic IPs)
4. Click **Confirm**

---

## Step 5 — Get the Connection String
1. Go back to **Database** in left sidebar
2. Click **Connect** on your cluster
3. Choose **Drivers**
4. Select:
   - Driver: **Node.js**
   - Version: **5.5 or later**
5. Copy the connection string. It looks like this:
```
mongodb+srv://ptepath-admin:<password>@ptepath-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
6. Replace `<password>` with your actual database user password you created in Step 3
7. Add your database name after `.net/` — replace `?` with `ptepath?`:
```
mongodb+srv://ptepath-admin:<password>@ptepath-cluster.xxxxx.mongodb.net/ptepath?retryWrites=true&w=majority
```

---

## Step 6 — Save to .env File
In your project root, inside the `backend/` folder, create a file called `.env`:

```
MONGO_URI=mongodb+srv://ptepath-admin:<yourpassword>@ptepath-cluster.xxxxx.mongodb.net/ptepath?retryWrites=true&w=majority
```

> Make sure `.env` is in your `.gitignore`. Never commit this file to GitHub.

---

## Step 7 — Verify Connection String is Correct
Double check:
- `ptepath-admin` = your database username
- `<yourpassword>` = replaced with actual password (no angle brackets)
- `/ptepath?` = your database name is `ptepath`
- No spaces anywhere in the string

---

## Step 8 — Create the Database (Optional at This Stage)
MongoDB Atlas creates the database automatically when your backend first connects and writes data. You do not need to manually create it now.

However if you want to verify everything is working:
1. Click on your cluster name in the Atlas dashboard
2. Click **Browse Collections**
3. Click **Add My Own Data**
4. Database name: `ptepath`
5. Collection name: `users`
6. Click **Create**

This confirms your cluster is working.

---

## What You Now Have
- MongoDB Atlas free cluster running
- Database user created
- Network access open
- Connection string ready
- MONGO_URI saved in `backend/.env`

---

## Done ✓
MongoDB Atlas is ready.

## Next Step
→ Follow `03-cloudinary-setup.md`
