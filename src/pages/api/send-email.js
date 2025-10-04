import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { to, subject, message } = req.body;

      const { data, error } = await resend.emails.send({
        from: 'santi@myworkinpe.lat', // Reemplaza con tu dominio verificado
        to,
        subject,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      });

      if (error) {
        return res.status(400).json({ error });
      }

      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}