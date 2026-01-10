package JobSearch.Services;

import Authentication.DTO.UserDto;
import DbConnections.DTO.Entities.SavedQuery;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${email.from}")
    private String fromEmail;

    @Value("${email.enabled:false}")
    private boolean emailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send job notification email to user
     */
    public void sendJobNotification(UserDto user, SavedQuery query, int newJobCount) {
        if (!emailEnabled) {
            logger.info("Email notifications are disabled. Skipping email for user: {}", user.getEmail());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject(String.format("🎯 %d New Job%s Found: %s", 
                newJobCount, 
                newJobCount > 1 ? "s" : "", 
                query.getQuery()));

            String htmlContent = buildEmailTemplate(user, query, newJobCount);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Job notification email sent to: {} for query: '{}'", user.getEmail(), query.getQuery());

        } catch (MessagingException e) {
            logger.error("Failed to send email to: {} - {}", user.getEmail(), e.getMessage(), e);
        }
    }

    /**
     * Build HTML email template
     */
    private String buildEmailTemplate(UserDto user, SavedQuery query, int newJobCount) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background: white;
                        border-radius: 8px;
                        padding: 30px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 30px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .badge {
                        display: inline-block;
                        background: #4CAF50;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 18px;
                        margin: 10px 0;
                    }
                    .details {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 6px;
                        margin: 20px 0;
                    }
                    .details h2 {
                        margin-top: 0;
                        color: #667eea;
                        font-size: 20px;
                    }
                    .detail-item {
                        margin: 10px 0;
                        padding: 10px 0;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .detail-item:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        font-weight: 600;
                        color: #555;
                        display: inline-block;
                        min-width: 100px;
                    }
                    .cta-button {
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 14px 32px;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e0e0e0;
                        color: #777;
                        font-size: 14px;
                    }
                    .emoji {
                        font-size: 48px;
                        margin: 10px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="emoji">🎯</div>
                        <h1>New Jobs Found!</h1>
                        <div class="badge">%d New Job%s</div>
                    </div>
                    
                    <p>Hi %s,</p>
                    
                    <p>Great news! We've found <strong>%d new job posting%s</strong> that match your saved search.</p>
                    
                    <div class="details">
                        <h2>Search Details</h2>
                        <div class="detail-item">
                            <span class="detail-label">Job Title:</span>
                            <strong>%s</strong>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Location:</span>
                            <strong>%s</strong>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Distance:</span>
                            <strong>%d miles</strong>
                        </div>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="http://localhost:3000" class="cta-button">
                            View Jobs Now →
                        </a>
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                        💡 <strong>Tip:</strong> Don't wait too long! Popular positions can fill up quickly.
                    </p>
                    
                    <div class="footer">
                        <p>This is an automated notification from your JobHunter saved search.</p>
                        <p>To manage your saved searches, log in to your dashboard.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            newJobCount,
            newJobCount > 1 ? "s" : "",
            user.getFirstName() != null ? user.getFirstName() : user.getUsername(),
            newJobCount,
            newJobCount > 1 ? "s" : "",
            query.getQuery(),
            query.getLocation(),
            query.getDistance()
        );
    }
}
