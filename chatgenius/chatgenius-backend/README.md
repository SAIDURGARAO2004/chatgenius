# ChatGenius Backend - SIMPLE START GUIDE

## ✅ Backend is Now Running!

Your backend is currently running on: **http://127.0.0.1:5000**

---

## 🚀 To Start Backend (Choose ONE Method)

### Method 1: Double-Click (Easiest!)

Just **double-click** this file:
```
START.bat
```

Located at: `chatgenius-backend/START.bat`

### Method 2: One Command

```cmd
START.bat
```

### Method 3: PowerShell Script

```powershell
.\start.ps1
```

### Method 4: Manual (If needed)

```powershell
# Kill existing processes
Get-Process python | Stop-Process -Force

# Start server
python run.py
```

---

## ⚠️ IMPORTANT

**Always use `START.bat` or `start.ps1` instead of `python run.py` directly!**

Why? These scripts automatically kill old processes first, preventing port conflicts.

---

## ✅ How to Know It's Working

You should see:
```
========================================
  ChatGenius Backend - Quick Start
========================================

[1/2] Killing existing Python processes...
      [+] Done

[2/2] Starting backend server...
      Port: 5000
      Press Ctrl+C to stop

========================================

(10000) wsgi starting up on http://127.0.0.1:5000
```

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Start Backend | `START.bat` or `.\start.ps1` |
| Stop Backend | Press `Ctrl+C` in terminal |
| Kill Port 5000 | `Get-Process python \| Stop-Process -Force` |
| Check Status | Look for "wsgi starting up on http://127.0.0.1:5000" |

---

## 🔧 If You Get Port Error

If you see "Port 5000 is already in use", just run:

```powershell
Get-Process python | Stop-Process -Force
```

Then start again with `START.bat`

---

## 📝 Summary

✅ **Use `START.bat` to start backend**  
✅ **Backend runs on port 5000**  
✅ **Frontend runs on port 5174**  
✅ **No more port conflicts!**

**That's it! Simple! 🚀**
