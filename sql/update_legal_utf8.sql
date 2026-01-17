-- Actualizar contenido con UTF-8 correcto

UPDATE legal_documents SET content = '<h3>Términos y Condiciones de Lawrence Network Services</h3>

<p><strong>Última actualización:</strong> Enero 2026</p>

<h4>1. Aceptación de los Términos</h4>
<p>Al acceder y utilizar Lawrence Network Services, usted acepta estar sujeto a estos términos y condiciones.</p>

<h4>2. Descripción del Servicio</h4>
<p>Lawrence Network Services es una plataforma de gestión de proyectos y servicios técnicos que conecta clientes con técnicos especializados.</p>

<h4>3. Registro y Cuenta</h4>
<p>Para utilizar nuestros servicios, debe:</p>
<ul>
  <li>Crear una cuenta proporcionando información veraz</li>
  <li>Mantener la confidencialidad de su contraseña</li>
  <li>Ser mayor de 18 años o tener autorización parental</li>
  <li>Notificar cualquier uso no autorizado de su cuenta</li>
</ul>

<h4>4. Uso Aceptable</h4>
<p>Usted se compromete a:</p>
<ul>
  <li>No violar leyes o regulaciones aplicables</li>
  <li>No transmitir contenido ofensivo o ilegal</li>
  <li>No interferir con el funcionamiento del servicio</li>
  <li>No intentar acceder a áreas restringidas</li>
</ul>

<h4>5. Propiedad Intelectual</h4>
<p>Todo el contenido, marcas y logotipos son propiedad de Lawrence Network Services o sus licenciantes.</p>

<h4>6. Limitación de Responsabilidad</h4>
<p>Lawrence Network Services no será responsable por daños indirectos, incidentales o consecuentes que surjan del uso del servicio.</p>

<h4>7. Modificaciones</h4>
<p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse.</p>

<h4>8. Terminación</h4>
<p>Podemos suspender o terminar su cuenta si viola estos términos.</p>

<h4>9. Contacto</h4>
<p>Para preguntas sobre estos términos:</p>
<p><strong>Email:</strong> legal@lawrencenetwork.com</p>'
WHERE document_type = 'terms' AND language = 'es';

UPDATE legal_documents SET content = '<h3>Política de Privacidad de Lawrence Network Services</h3>

<p><strong>Última actualización:</strong> Enero 2026</p>

<h4>1. Información que recopilamos</h4>
<p>Recopilamos información que usted nos proporciona directamente cuando:</p>
<ul>
  <li>Crea una cuenta</li>
  <li>Actualiza su perfil</li>
  <li>Utiliza nuestros servicios</li>
  <li>Se comunica con nosotros</li>
</ul>

<h4>2. Uso de la información</h4>
<p>Utilizamos la información recopilada para:</p>
<ul>
  <li>Proporcionar y mantener nuestros servicios</li>
  <li>Mejorar la experiencia del usuario</li>
  <li>Comunicarnos con usted sobre actualizaciones</li>
  <li>Garantizar la seguridad de la plataforma</li>
</ul>

<h4>3. Compartir información</h4>
<p>No vendemos ni compartimos su información personal con terceros, excepto:</p>
<ul>
  <li>Con su consentimiento explícito</li>
  <li>Para cumplir con requisitos legales</li>
  <li>Para proteger nuestros derechos y seguridad</li>
</ul>

<h4>4. Seguridad</h4>
<p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal.</p>

<h4>5. Sus derechos</h4>
<p>Usted tiene derecho a:</p>
<ul>
  <li>Acceder a su información personal</li>
  <li>Corregir datos inexactos</li>
  <li>Solicitar la eliminación de sus datos</li>
  <li>Oponerse al procesamiento de sus datos</li>
</ul>

<h4>6. Contacto</h4>
<p>Si tiene preguntas sobre esta política, contáctenos en:</p>
<p><strong>Email:</strong> privacy@lawrencenetwork.com</p>'
WHERE document_type = 'privacy' AND language = 'es';
