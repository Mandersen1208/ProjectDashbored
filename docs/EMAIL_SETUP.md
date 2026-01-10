# Email Notification Setup Guide

## Overview
The JobHunter application can send email notifications to users when new jobs matching their saved searches are found during the daily scheduled job fetch (runs at midnight).

## Features
- **Automatic Notifications**: Users receive beautiful HTML emails when new jobs are found
- **Job Count Tracking**: Shows the number of new jobs in the saved_queries table
- **Professional Templates**: Gradient design with clear call-to-action buttons
- **Secure Configuration**: Uses environment variables for sensitive credentials

## Email Configuration

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification
   - Enable it if not already enabled

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and name it "JobHunter"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Configure Environment Variables**
   
   Create a `.env` file in the project root:
   ```bash
   EMAIL_ENABLED=true
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### Option 2: Other SMTP Providers

#### Outlook/Hotmail
```bash
EMAIL_ENABLED=true
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
EMAIL_FROM=your-email@outlook.com
```

#### SendGrid
```bash
EMAIL_ENABLED=true
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=verified-sender@yourdomain.com
```

#### AWS SES
```bash
EMAIL_ENABLED=true
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=your-ses-smtp-username
MAIL_PASSWORD=your-ses-smtp-password
EMAIL_FROM=verified-email@yourdomain.com
```

## Running with Docker Compose

The email configuration is already integrated into `docker-compose.yml`. Simply:

1. Create your `.env` file in the project root with your email settings
2. Restart the application:
   ```bash
   docker-compose down
   docker-compose up -d --build app
   ```

## Testing Email Notifications

### Enable Test Mode (Every 1 Minute)
For testing, you can temporarily change the schedule in `ScheduledJobFetchService.java`:

```java
// Change from:
@Scheduled(cron = "0 0 0 * * *")  // Daily at midnight

// To:
@Scheduled(fixedRate = 60000)  // Every 1 minute
```

Then rebuild: `docker-compose up -d --build app`

### Steps to Test:
1. Create a user account
2. Login and save a job search
3. Wait for the scheduled job to run (1 minute in test mode)
4. Check your email inbox
5. Check the `saved_queries` table - `new_jobs_count` should be updated

## Email Template

The notification email includes:
- **Subject**: "🎯 X New Jobs Found: [Job Title]"
- **Header**: Gradient purple/blue design with job count badge
- **Details**: Job title, location, distance
- **CTA Button**: Direct link to view jobs in dashboard
- **Footer**: Information about managing saved searches

## Disabling Email Notifications

Set `EMAIL_ENABLED=false` in your `.env` file or environment variables.

## Troubleshooting

### Emails Not Sending
1. **Check logs**: `docker logs jobhunter-app --tail 100`
2. **Verify EMAIL_ENABLED=true**
3. **Check SMTP credentials** are correct
4. **For Gmail**: Ensure App Password is used, not regular password
5. **Check firewall**: Port 587 must be open for SMTP

### "Authentication Failed" Error
- Gmail: Use App Password, not account password
- Verify username is correct (usually the full email address)
- Check if 2FA is enabled (required for Gmail)

### No Emails Despite New Jobs
- Check `new_jobs_count` in `saved_queries` table
- Verify saved query `is_active = true`
- Check that user email exists in database
- Review backend logs for email sending attempts

## Database Schema

The `saved_queries` table includes:
```sql
new_jobs_count INTEGER DEFAULT 0  -- Updated by scheduled job
last_run_at TIMESTAMP              -- Last time jobs were fetched
```

## Security Notes

⚠️ **Never commit `.env` file to git**
- It's already in `.gitignore`
- Use `.env.example` as a template
- Rotate credentials regularly
- Use app-specific passwords when possible

## Production Recommendations

1. **Use a dedicated SMTP service** (SendGrid, AWS SES, Mailgun)
2. **Configure SPF/DKIM** records for your domain
3. **Monitor email delivery rates**
4. **Implement email throttling** if sending to many users
5. **Add unsubscribe functionality** (future enhancement)
6. **Use environment-specific configurations**

## Future Enhancements

- [ ] Email preferences per user (opt-in/opt-out)
- [ ] Email frequency preferences (daily, weekly)
- [ ] Digest emails (combine multiple searches)
- [ ] Job detail preview in email
- [ ] Unsubscribe link
- [ ] Email open/click tracking
- [ ] Mobile-responsive email templates
