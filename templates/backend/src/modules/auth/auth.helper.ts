export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const getEmailTemplate = (code: string, expiryTime: number): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Verification Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 5px;
              text-align: center;
              color: #2563eb;
              margin: 20px 0;
              padding: 15px;
              background-color: #fff;
              border-radius: 4px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Verification Code</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Please use the following verification code to proceed:</p>
            <div class="code">${code}</div>
            <p>This code will expire in ${expiryTime} minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;
}