-- Tabla para almacenar políticas de privacidad y términos y condiciones
-- Multiidioma: español e inglés

CREATE TABLE IF NOT EXISTS legal_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_type ENUM('privacy', 'terms') NOT NULL COMMENT 'Tipo de documento',
  language VARCHAR(5) NOT NULL DEFAULT 'es' COMMENT 'Código de idioma: es, en',
  title VARCHAR(255) NOT NULL COMMENT 'Título del documento',
  content TEXT NOT NULL COMMENT 'Contenido del documento (HTML permitido)',
  version VARCHAR(20) DEFAULT '1.0' COMMENT 'Versión del documento',
  effective_date DATE DEFAULT NULL COMMENT 'Fecha efectiva del documento',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_doc_lang (document_type, language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar política de privacidad en español
INSERT INTO legal_documents (document_type, language, title, content, version, effective_date) VALUES 
('privacy', 'es', 'Política de Privacidad', 
'<h3>Política de Privacidad de Lawrence Network Services</h3>

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
<p><strong>Email:</strong> privacy@lawrencenetwork.com</p>',
'1.0', '2026-01-01'),

-- Insertar política de privacidad en inglés
('privacy', 'en', 'Privacy Policy', 
'<h3>Lawrence Network Services Privacy Policy</h3>

<p><strong>Last updated:</strong> January 2026</p>

<h4>1. Information We Collect</h4>
<p>We collect information you provide directly when you:</p>
<ul>
  <li>Create an account</li>
  <li>Update your profile</li>
  <li>Use our services</li>
  <li>Communicate with us</li>
</ul>

<h4>2. Use of Information</h4>
<p>We use the collected information to:</p>
<ul>
  <li>Provide and maintain our services</li>
  <li>Improve user experience</li>
  <li>Communicate with you about updates</li>
  <li>Ensure platform security</li>
</ul>

<h4>3. Sharing Information</h4>
<p>We do not sell or share your personal information with third parties, except:</p>
<ul>
  <li>With your explicit consent</li>
  <li>To comply with legal requirements</li>
  <li>To protect our rights and security</li>
</ul>

<h4>4. Security</h4>
<p>We implement technical and organizational security measures to protect your personal information.</p>

<h4>5. Your Rights</h4>
<p>You have the right to:</p>
<ul>
  <li>Access your personal information</li>
  <li>Correct inaccurate data</li>
  <li>Request deletion of your data</li>
  <li>Object to processing of your data</li>
</ul>

<h4>6. Contact</h4>
<p>If you have questions about this policy, contact us at:</p>
<p><strong>Email:</strong> privacy@lawrencenetwork.com</p>',
'1.0', '2026-01-01'),

-- Insertar términos y condiciones en español
('terms', 'es', 'Términos y Condiciones', 
'<h3>Términos y Condiciones de Lawrence Network Services</h3>

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
<p><strong>Email:</strong> legal@lawrencenetwork.com</p>',
'1.0', '2026-01-01'),

-- Insertar términos y condiciones en inglés
('terms', 'en', 'Terms and Conditions', 
'<h3>Lawrence Network Services Terms and Conditions</h3>

<p><strong>Last updated:</strong> January 2026</p>

<h4>1. Acceptance of Terms</h4>
<p>By accessing and using Lawrence Network Services, you agree to be bound by these terms and conditions.</p>

<h4>2. Service Description</h4>
<p>Lawrence Network Services is a project management and technical services platform that connects clients with specialized technicians.</p>

<h4>3. Registration and Account</h4>
<p>To use our services, you must:</p>
<ul>
  <li>Create an account providing truthful information</li>
  <li>Maintain the confidentiality of your password</li>
  <li>Be 18 years or older or have parental authorization</li>
  <li>Notify any unauthorized use of your account</li>
</ul>

<h4>4. Acceptable Use</h4>
<p>You agree to:</p>
<ul>
  <li>Not violate applicable laws or regulations</li>
  <li>Not transmit offensive or illegal content</li>
  <li>Not interfere with service operation</li>
  <li>Not attempt to access restricted areas</li>
</ul>

<h4>5. Intellectual Property</h4>
<p>All content, trademarks and logos are property of Lawrence Network Services or its licensors.</p>

<h4>6. Limitation of Liability</h4>
<p>Lawrence Network Services shall not be liable for indirect, incidental or consequential damages arising from use of the service.</p>

<h4>7. Modifications</h4>
<p>We reserve the right to modify these terms at any time. Changes will take effect upon posting.</p>

<h4>8. Termination</h4>
<p>We may suspend or terminate your account if you violate these terms.</p>

<h4>9. Contact</h4>
<p>For questions about these terms:</p>
<p><strong>Email:</strong> legal@lawrencenetwork.com</p>',
'1.0', '2026-01-01');
