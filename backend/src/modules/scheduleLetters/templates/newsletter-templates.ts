// base template, que recibe contenido, headerImage y logo
function buildBaseTemplate(
  content: string,
  headerImageUrl: string,
  logoUrl: string,
): string {
  return `
    <div style="font-family: 'Montserrat', sans-serif; background-color: #ffffff; color: #392f5a; padding: 30px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${headerImageUrl}" alt="Header Image" style="max-width: 100%; height: auto; border-radius: 8px;" />
      </div>
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoUrl}" alt="ROOTS COOPERATIVA Logo" style="height: 60px; width: auto;" />
      </div>
      <div>
        ${content}
      </div>
      <p style="margin-top: 40px; font-size: 0.8em; color: #888; text-align: center;">
        Este mensaje fue enviado automáticamente por ROOTS COOPERATIVA.
      </p>
    </div>
  `;
}

// contenido de monthly newsletter
function buildMonthlyNewsletterContent(name: string): string {
  return `
    <h1 style="font-family: 'Bebas Neue', sans-serif; color: #017d74;">Hola ${name} 👋</h1>
    <p>¡Gracias por ser parte de ROOTS COOPERATIVA!</p>
    <p>Este es tu newsletter mensual con novedades, próximos eventos y consejos sustentables 🌱</p>
    <p style="margin-top: 30px;">Visitá nuestro sitio para más info:</p>
    <a href="https://frontend-rootscoop.vercel.app" style="display: inline-block; background-color: #017d74; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Ir al sitio</a>
    <div style="margin-top: 30px;">
      <img src="https://example.com/evento1.jpg" alt="Evento 1" style="width: 100%; max-width: 250px; border-radius: 6px; margin-right: 10px;" />
      <img src="https://example.com/evento2.jpg" alt="Evento 2" style="width: 100%; max-width: 250px; border-radius: 6px;" />
    </div>
  `;
}

// contenido de welcome newsletter
function buildWelcomeNewsletterContent(name: string): string {
  return `
    <h1 style="font-family: 'Bebas Neue', sans-serif; color: #017d74;">¡Bienvenidx ${name} 👋!</h1>
    <p>Gracias por registrarte en ROOTS COOPERATIVA 🌿</p>
    <p>Estamos felices de que te sumes a esta comunidad consciente y sustentable.</p>
    <p>En breve recibirás novedades y beneficios exclusivos.</p>
    <p style="margin-top: 30px;">Explorá nuestros contenidos:</p>
    <a href="https://frontend-rootscoop.vercel.app" style="display: inline-block; background-color: #017d74; color: #fff; padding: 10px 20px; border-radius: 4px; text-decoration: none;">Ir al sitio</a>
    <div style="margin-top: 30px;">
      <img src="https://example.com/beneficios.jpg" alt="Beneficios exclusivos" style="width: 100%; max-width: 300px; border-radius: 6px;" />
    </div>
  `;
}

// exportás las funciones que usan la base + contenido
export function buildMonthlyNewsletterHtml(name: string): string {
  const headerImageUrl = 'https://example.com/header-monthly.jpg'; // cambiá por tu imagen real
  const logoUrl = 'https://example.com/logo.png'; // tu logo
  const content = buildMonthlyNewsletterContent(name);
  return buildBaseTemplate(content, headerImageUrl, logoUrl);
}

export function buildWelcomeNewsletterHtml(name: string): string {
  const headerImageUrl = 'https://example.com/header-welcome.jpg';
  const logoUrl = 'https://example.com/logo.png';
  const content = buildWelcomeNewsletterContent(name);
  return buildBaseTemplate(content, headerImageUrl, logoUrl);
}
