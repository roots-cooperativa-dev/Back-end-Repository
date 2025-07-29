import * as juice from 'juice';

function buildImageRows(
  images: Array<{ url: string; alt: string; description?: string }>,
): string {
  let imageHtml = '';

  if (images.length >= 2) {
    imageHtml += `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 600px; table-layout: fixed;">
        <tr>
          <td class="image-2-col-cell" width="50%" style="width: 50%; padding: 5px; vertical-align: top;">
            <img src="${images[0].url}" alt="${images[0].alt}" style="max-width: 100%; height: 200px; object-fit: cover; display: block; margin: 0 auto; border-radius: 5px;" />
            ${images[0].description ? `<p style="text-align: center; font-size: 0.85em; color: #333; margin-top: 10px; font-family: 'Montserrat', sans-serif; font-weight: 600;">${images[0].description}</p>` : ''}
          </td>
         <td class="image-2-col-cell" width="50%" style="width: 50%; padding: 5px; vertical-align: top;">
            <img src="${images[1].url}" alt="${images[1].alt}" style="max-width: 100%; height: 200px; object-fit: cover; display: block; margin: 0 auto; border-radius: 5px;" />

            ${images[1].description ? `<p style="text-align: center; font-size: 0.85em; color: #333; margin-top: 10px; font-family: 'Montserrat', sans-serif; font-weight: 600;">${images[1].description}</p>` : ''}
          </td>
        </tr>
      </table>
    `;
    for (let i = 2; i < images.length; i++) {
      imageHtml += `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 600px; table-layout: fixed; padding: 10px 0;">
          <tr>
            <td style="padding: 0;">
              <img src="${images[i].url}" alt="${images[i].alt}" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 5px;" />
              ${images[i].description ? `<p style="text-align: center; font-size: 0.85em; color: #333; margin-top: 10px; font-family: 'Montserrat', sans-serif; font-weight: 600;">${images[i].description}</p>` : ''}
            </td>
          </tr>
        </table>
      `;
    }
  } else if (images.length === 1) {
    imageHtml += `
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; max-width: 600px; table-layout: fixed; padding: 10px 0;">
        <tr>
          <td style="padding: 0;">
            <img src="${images[0].url}" alt="${images[0].alt}" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 5px;" />
            ${images[0].description ? `<p style="text-align: center; font-size: 0.85em; color: #333; margin-top: 10px; font-family: 'Montserrat', sans-serif; font-weight: 600;">${images[0].description}</p>` : ''}
          </td>
        </tr>
      </table>
    `;
  }
  return imageHtml;
}

function buildBaseTemplate(
  content: string,
  imageContent: string,
  headerImageUrl: string,
  logoUrl: string,
): string {
  const html = `
  <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Newsletter ROOTS</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600&family=Bebas+Neue&display=swap" rel="stylesheet">
  <style type="text/css">
    /* Reset CSS */
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }

    /* General styles */
    body, html {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: 'Montserrat', sans-serif;
      color: #392f5a;
      line-height: 1.6;
      height: 100%;
      width: 100%;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #922f4e;
      padding: 0;
      text-align: center;
      overflow: hidden;
    }
    .header img {
      width: 100%;
      max-width: 100%;
      object-fit: cover;
      display: block;
      margin: 0 auto;
      border-radius: 0;
    }
    .footer {
      background-color: #922f4e;
      padding: 15px;
      text-align: center;
      border-top: 1px solid #4d206c;
      color: #ffdd00;
      font-size: 0.9em;
    }
    .footer a {
      color: #ffdd00;
      text-decoration: none;
    }
    .content {
      padding-top: 50px !important;
      margin-top: 30px;
      margin-bottom: 30px;
    }
    .content h1 {
      margin-top: 30px;
    }
    .content p {
      margin-bottom: 15px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
    }
    .content strong {
      color: #642d91;
    }
    .social-container {
      margin: 30px auto;
      text-align: center;
    }
    .social-icons {
      display: inline-flex;
      gap: 40px;
      justify-content: center;
      align-items: center;
    }
    .social-icon {
      background-color: #ffffff;
      padding: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    /* Responsive styles */
    @media screen and (max-width: 480px) {
      body {
        padding: 0 !important;
      }
      .container {
        width: 100% !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .content {
        padding: 30px;
        margin-bottom: 50px;
        margin-top: 50px;
      }
      .header img {
        height: 180px !important;
      }
      .image-2-col-cell {
        width: 100% !important;
        display: block !important;
        text-align: center !important;
      }
      .image-2-col-cell img {
        margin: 0 auto !important;
      }
      .hero-logo img {
        height: auto !important;
        width: 100px !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" 
      style="background-image: url(${headerImageUrl}); background-size: cover; background-position: center; text-align: left; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 30px; background-color: rgba(0,0,0,0.2);">
          <table width="100%">
            <tr>
              <td class="hero-text" align="left" style="vertical-align: top;">
                <h1 style="color: white; font-family: 'Bebas Neue', sans-serif; font-size: 36px; margin: 0;">¡Hola!</h1>
                <p style="color: white; font-family: 'Montserrat', sans-serif; font-weight: 600;">Gracias por sumarte a ROOTS COOPERATIVA 🌿</p>
              </td>
              <td class="hero-logo" align="right" style="vertical-align: top;">
                <img src="${logoUrl}" alt="Logo" style="height: 140px; width: auto;" />
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="content"; style="margin-top: 10px;">
      ${content}
    </div>

    ${imageContent}

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" 
      style="background-image: url(${headerImageUrl}); background-size: cover; background-position: center; text-align: center; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 20px; background-color: rgba(0,0,0,0.4);">
          <p style="margin-bottom: 15px; font-family: 'Montserrat', sans-serif; font-weight: 600; color: #ffdd00;">
            Este correo ha sido enviado por <strong style="color: #ffffff;">ROOTS COOPERATIVA</strong>.
          </p>
          <p style="margin-bottom: 15px; font-family: 'Montserrat', sans-serif; font-weight: 600; color: #ffdd00;">
            <a href="https://frontend-rootscoop.vercel.app" style="color: #ffdd00; text-decoration: none;">Visita nuestro sitio web</a>
          </p>
        </td>
      </tr>
    </table>

    <div class="social-container">
      <p style="font-family: 'Montserrat', sans-serif; font-weight: 600; margin-bottom: 10px; color: #642d91;">
        Seguinos en nuestras redes:
      </p>
      <div class="social-icons">
        <a href="https://wa.link/b4wyji" target="_blank" class="social-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/124/124034.png" alt="WhatsApp" width="28" height="28" style="display: block;">
        </a>
        <a href="https://www.instagram.com/roots_cooperativa?igsh=MWx3OTI3NjZidDJ3dg==" target="_blank" class="social-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="28" height="28" style="display: block;">
        </a>
        <a href="http://www.youtube.com/@rootscooperativa561" target="_blank" class="social-icon">
          <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" width="28" height="28" style="display: block;">
        </a>
      </div>
    </div>
  </div>
</body>
</html>

  `;
  return juice(html);
}

function buildMonthlyNewsletterContent(
  name: string,
  images: Array<{ url: string; alt: string; description?: string }>,
): { textContent: string; imageHtml: string } {
  const textContent = `
    <h1 style="font-family: 'Bebas Neue', sans-serif; color: #017d74;">Hola ${name} 👋</h1>
    <p>¡Gracias por ser parte de ROOTS COOPERATIVA!</p>
    <p>Este es tu newsletter mensual con novedades, próximos eventos y consejos sustentables 🌱</p>
    <p style="margin-top: 30px;">Visitá nuestro sitio para más info:</p>
    <a href="https://frontend-rootscoop.vercel.app" style="display: inline-block; background-color: #017d74; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Ir al sitio</a>
  `;
  const imageHtml = buildImageRows(images);
  return { textContent, imageHtml };
}

function buildWelcomeNewsletterContent(
  name: string,
  images: Array<{ url: string; alt: string; description?: string }>,
): { textContent: string; imageHtml: string } {
  const textContent = `
    <h1 style="font-family: 'Bebas Neue', sans-serif; color: #017d74; margin-top:20px;">¡Bienvenido/a ${name} 👋!</h1>
    <p>Gracias por ser parte de ROOTS COOPERATIVA 🌿</p>
    <p>Estamos felices de que te sumes a esta comunidad consciente y sustentable.</p>
    <p>En breve recibirás novedades y beneficios exclusivos.</p>
    <p style="margin-top: 30px;">Explorá nuestros contenidos:</p>
    <a href="https://frontend-rootscoop.vercel.app" style="display: inline-block; background-color: #017d74; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Ir al sitio</a>
  `;
  const imageHtml = buildImageRows(images);
  return { textContent, imageHtml };
}

export function buildMonthlyNewsletterHtml(name: string): string {
  const headerImageUrl =
    'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694170/IMG_5118_vaess8.jpg';
  const logoUrl =
    'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753703082/sol_sf2bpt.png';

  const monthlyImages = [
    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694123/1_49_1_jngdpy.jpg',
      alt: 'Nuestros nuevos sabores',
      description: 'Descubre nuestras variedades.',
    },
    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694180/Compartida_desde_Lightroom_mrbpdj.jpg',
      alt: 'Nuestros nuevos sabores',
      description: 'Nuestras empanadas!',
    },
    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694096/12042017-IMG_6202_1_vweqi3.jpg',
      alt: 'Nuestros nuevos sabores',
      description: 'Nuevas pizzas veganas!',
    },

    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694076/FOTO_1_t8jwxu.jpg',
      alt: 'Eventos',
      description: 'Quienes somos',
    },
    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694200/FOTOS_SR1-14_wfdk7p.jpg',
      alt: 'Eventos',
      description: 'Próximos eventos de la comunidad.',
    },

    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753702260/Login_hwnygs.jpg',
      alt: 'Roots',
      description: 'Nuestro local',
    },
  ];

  const { textContent, imageHtml } = buildMonthlyNewsletterContent(
    name,
    monthlyImages,
  );
  return buildBaseTemplate(textContent, imageHtml, headerImageUrl, logoUrl);
}

export function buildWelcomeNewsletterHtml(name: string): string {
  const headerImageUrl =
    'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694170/IMG_5118_vaess8.jpg';
  const logoUrl =
    'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753703082/sol_sf2bpt.png';

  const welcomeImages = [
    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694136/Compartida_desde_Lightroom_1_1_xp2t5m.jpg',
      alt: 'Beneficios exclusivos',
      description: 'Accede a ofertas únicas.',
    },
    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694230/FOTOS_SR1-25_vgwgn4.jpg',
      alt: 'Nuestra comunidad',
      description: 'Se parte de nuestra comunidad.',
    },
    {
      url: 'https://res.cloudinary.com/djzcrrbfb/image/upload/v1753694160/FOTOS_SR1-6_fq5arm.jpg',
      alt: 'Impacto positivo',
      description: 'Participa de nuestros eventos.',
    },
  ];

  const { textContent, imageHtml } = buildWelcomeNewsletterContent(
    name,
    welcomeImages,
  );
  return buildBaseTemplate(textContent, imageHtml, headerImageUrl, logoUrl);
}
