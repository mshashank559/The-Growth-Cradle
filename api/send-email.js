export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, role, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY is not defined in Vercel environment variables.');
        return res.status(500).json({ 
            error: 'Email service is currently unconfigured. Please set RESEND_API_KEY in Vercel.' 
        });
    }

    try {
        // Construct clean HTML email
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111111; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background-color: #0D0D0E; padding: 24px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; letter-spacing: 1px;">THE GROWTH CRADLE</h1>
                    <p style="color: #FF6B35; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase;">New Discovery Call Lead</p>
                </div>
                <div style="padding: 32px; background-color: #FAFAFA;">
                    <p style="font-size: 16px; margin-top: 0;">Hello Aaina,</p>
                    <p style="font-size: 16px;">You have received a new lead inquiry from the website contact form. Here are the details:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec; font-weight: bold; width: 140px;">Name:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec; font-weight: bold;">Email:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec;"><a href="mailto:${email}" style="color: #FF6B35; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec; font-weight: bold;">Phone:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec;">${phone || 'Not Provided'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec; font-weight: bold;">Role / Company:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eaeaec;">${role || 'Not Provided'}</td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 24px;">
                        <p style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">Brand Goals / Objective:</p>
                        <div style="background-color: #FFFFFF; border: 1px solid #eaeaec; padding: 20px; border-radius: 8px; font-style: italic; white-space: pre-line; color: #333333;">${message}</div>
                    </div>
                </div>
                <div style="background-color: #EAEAEC; padding: 15px; text-align: center; font-size: 12px; color: #8E8E93;">
                    This lead was automatically generated from The Growth Cradle website.
                </div>
            </div>
        `;

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'The Growth Cradle Lead <onboarding@resend.dev>',
                to: ['mshashank559@gmail.com'], // Changed to mshashank559@gmail.com for testing (Resend Sandbox restriction)
                subject: `New Lead: Discovery Call Request from ${name}`,
                html: emailHtml,
                reply_to: email
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, id: data.id });
        } else {
            console.error('Resend API response error:', data);
            return res.status(response.status).json({ 
                error: data.message || 'Failed to send lead email through Resend.' 
            });
        }
    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
