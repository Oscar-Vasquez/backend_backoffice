// Definición de tipos para Express.Multer.File
declare namespace Express {
  namespace Multer {
    interface File {
      /** Campo del formulario que se refiere a este archivo */
      fieldname: string;
      /** Nombre original del archivo en la computadora del usuario */
      originalname: string;
      /** La codificación del archivo */
      encoding: string;
      /** El tipo MIME del archivo */
      mimetype: string;
      /** El tamaño del archivo en bytes */
      size: number;
      /** La carpeta donde se almacena el archivo */
      destination: string;
      /** El nombre del archivo dentro de destination */
      filename: string;
      /** Ruta completa al archivo cargado */
      path: string;
      /** Un Buffer que contiene el archivo completo */
      buffer: Buffer;
    }
  }
} 