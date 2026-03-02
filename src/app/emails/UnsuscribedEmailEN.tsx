// Este no es un componente de React, es una función que genera una cadena de texto HTML.
interface UnsubscribeEmailProps {
  name: string;
  endDate: string;
}

export function UnsubscribeEmailHtmlEN({ name, endDate }: UnsubscribeEmailProps) {
  
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-s/cale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Playfair+Display:wght@700&display=swap');

          body {
            font-family: 'Montserrat', sans-serif;
            background-color: #F8F0E3; /* Beige suave */
            color: #333333;
            margin: 0;
            padding: 0;
            line-height: 1.8;
          }
          .main-wrapper {
            max-width: 650px;
            margin: 40px auto;
            background-color: #FFFFFF;
            border-radius: 20px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #C2651A; /* Naranja oscuro, tono más serio */
            padding: 40px;
            text-align: center;
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            color: #FFFFFF;
            font-size: 48px;
            margin: 0;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          }
          .content {
            padding: 50px;
            text-align: center;
          }
          .content h2 {
            font-family: 'Playfair Display', serif;
            color: #2C3E50; /* Azul oscuro */
            font-size: 36px;
            margin-bottom: 20px;
          }
          .content p {
            font-size: 18px;
            color: #4A2C2A; /* Marrón */
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #E67E22 0%, #C2651A 100%);
            color: #FFFFFF !important;
            padding: 18px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
          }
          .button:hover {
            transform: translateY(-3px);
          }
          .footer {
            background-color: #2C3E50; /* Azul oscuro */
            padding: 30px 50px;
            text-align: center;
            border-bottom-left-radius: 20px;
            border-bottom-right-radius: 20px;
          }
          .footer-links {
            list-style: none;
            padding: 0;
            margin: 0 0 15px 0;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
          }
          .footer-links li a {
            color: #FDF5E6; /* Beige suave */
            text-decoration: none;
            font-size: 14px;
            transition: color 0.3s ease;
          }
          .footer-links li a:hover {
            color: #E67E22; /* Naranja vibrante */
          }
          .footer p {
            font-size: 14px;
            color: #FFFFFF;
            opacity: 0.6;
            margin: 0;
          }
        </style>
      </head>
        <body>
          <div class="main-wrapper">
            <div class="header">
              <img src="https://buffex.io/Buffex-Logo.png" alt="Buffex" style="width:72px; height:72px; display:block; margin:0 auto 12px auto;" />
              <h1>Buffex</h1>
            </div>
            <div class="content">
              <h2>We will miss you, ${name}!</h2>
              <p>
                We have received your request to cancel your subscription. We want to thank you for being part of our culinary community, and we hope you'll join us again soon. Your account and access to all our recipes will remain active until <strong>${endDate}</strong>.
              </p>
              <p>
                If you change your mind, just log back in, and from "My Profile," you can reactivate your subscription before it expires.
              </p>
              <a href="https://www.buffex.io/kitchen" class="button">Return to Buffex</a>
            </div>
            <div class="footer">
              <ul class="footer-links" style="display:flex; align-items:center; justify-content:center; text-align:center">
                <li><a href="https://www.buffex.io/consent/privacy">Privacy Policy</a></li>
                <li><a href="https://www.buffex.io/consent/terms">Terms of Service</a></li>
                <li><a href="https://www.buffex.io/consent/cookies">Cookie Policy</a></li>
              </ul>
              <p>Buffex &copy; 2025. All rights reserved.</p>
            </div>
          </div>
        </body>
    </html>
  `;
}
