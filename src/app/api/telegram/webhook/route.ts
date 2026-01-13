import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: NextRequest) {
    try {
        if (!TELEGRAM_TOKEN) {
            console.error('TELEGRAM_BOT_TOKEN is not set');
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        const payload = await request.json();
        const { message } = payload;

        if (!message || !message.text) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const text = message.text.trim();

        // 1. Handle /start
        if (text === '/start') {
            await sendTelegramMessage(chatId,
                'ยินดีต้อนรับสู่ Exportation Tracker Bot! 📦\n\n' +
                'กรุณาแจ้งให้ผู้ดูแลระบบ (Admin) ตั้งค่าเลขใบเสนอราคา (Quotation ID) ให้คุณ ' +
                'เมื่อตั้งค่าเสร็จแล้ว คุณสามารถเช็คสถานะเอกสารได้ด้วยคำสั่ง /status ครับ'
            );
            return NextResponse.json({ ok: true });
        }

        // 2. Handle /setquote [ID]
        if (text.startsWith('/setquote')) {
            const parts = text.split(' ');
            if (parts.length < 2) {
                await sendTelegramMessage(chatId, 'กรุณาใส่เลข Quotation ID ด้วยครับ เช่น: /setquote [ID]');
                return NextResponse.json({ ok: true });
            }

            const quoteId = parts[1];

            // Verify Quotation exists
            const { data: quote, error: quoteError } = await supabase
                .from('quotations')
                .select('id, customer_name')
                .eq('id', quoteId)
                .single();

            if (quoteError || !quote) {
                await sendTelegramMessage(chatId, `❌ ไม่พบเลขใบเสนอราคา: ${quoteId}`);
                return NextResponse.json({ ok: true });
            }

            // Save context in telegram_chats
            const { error: chatError } = await supabase
                .from('telegram_chats')
                .upsert({
                    chat_id: chatId,
                    current_quotation_id: quoteId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'chat_id' });

            if (chatError) {
                console.error('Error saving telegram chat context:', chatError);
                await sendTelegramMessage(chatId, 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่ครับ');
            } else {
                await sendTelegramMessage(chatId,
                    `✅ เชื่อมต่อกับใบเสนอราคาเรียบร้อยแล้ว!\n\n` +
                    `ลูกค้า: ${quote.customer_name}\n` +
                    `ID: ${quote.id}\n\n` +
                    `ตอนนี้คุณและลูกค้าสามารถพิมพ์ /status เพื่อเช็คสถานะเอกสารได้เลยครับ`
                );
            }
            return NextResponse.json({ ok: true });
        }

        // 3. Handle /status
        if (text === '/status') {
            // Get current context
            const { data: chatContext, error: contextError } = await supabase
                .from('telegram_chats')
                .select('current_quotation_id')
                .eq('chat_id', chatId)
                .single();

            if (contextError || !chatContext?.current_quotation_id) {
                await sendTelegramMessage(chatId, '⚠️ ยังไม่มีการเชื่อมต่อกับใบเสนอราคา กรุณาแจ้ง Admin ให้ใช้คำสั่ง /setquote [ID] ก่อนครับ');
                return NextResponse.json({ ok: true });
            }

            const quoteId = chatContext.current_quotation_id;

            // Fetch Quote required docs and current submissions
            const { data: quote } = await supabase
                .from('quotations')
                .select('required_doc_types, customer_name')
                .eq('id', quoteId)
                .single();

            const { data: submissions, error: subError } = await supabase
                .from('document_submissions')
                .select('document_type, file_url')
                .eq('quotation_id', quoteId);

            if (subError) {
                console.error('Error fetching submissions:', subError);
            }

            const DOCUMENT_CATEGORIES = [
                {
                    name: 'Company Information',
                    types: [
                        { id: 'company-registration', name: 'Company Registration' },
                        { id: 'company-declaration', name: 'Company Declaration' },
                        { id: 'id-card-copy', name: 'ID Card Copy' }
                    ]
                },
                {
                    name: 'Permits & TK Forms',
                    types: [
                        { id: 'import-permit', name: 'Import Permit' },
                        { id: 'tk-10', name: 'TK 10' },
                        { id: 'tk-10-eng', name: 'TK 10 (ENG Version)' },
                        { id: 'tk-11', name: 'TK 11' },
                        { id: 'tk-11-eng', name: 'TK 11 (ENG Version)' },
                        { id: 'tk-31', name: 'TK 31' },
                        { id: 'tk-31-eng', name: 'TK 31 (ENG Version)' },
                        { id: 'tk-32', name: 'TK 32' }
                    ]
                },
                {
                    name: 'Shipping Documents',
                    types: [
                        { id: 'purchase-order', name: 'Purchase Order' },
                        { id: 'msds', name: 'MSDS' },
                        { id: 'commercial-invoice', name: 'Commercial Invoice' },
                        { id: 'packing-list', name: 'Packing List' }
                    ]
                },
                {
                    name: 'Additional Documents',
                    types: [
                        { id: 'hemp-letter', name: 'Letter (Hemp Case)' },
                        { id: 'additional-file', name: 'Additional File' }
                    ]
                }
            ];

            const ALL_TYPES = DOCUMENT_CATEGORIES.flatMap(c => c.types.map(t => t.id));

            // Show all documents from the upload template
            const requiredTypes = ALL_TYPES;

            interface TelegramSubmission {
                document_type: string;
                file_url: string;
            }

            const submittedDocs = (submissions || []) as TelegramSubmission[];

            // Group docs by type to support multiple files per type
            const submittedGroups = new Map<string, TelegramSubmission[]>();
            submittedDocs.forEach(doc => {
                const group = submittedGroups.get(doc.document_type) || [];
                group.push(doc);
                submittedGroups.set(doc.document_type, group);
            }
            );

            let responseText = `📊 *สถานะเอกสาร:* ${quote?.customer_name || 'N/A'}\n`;
            responseText += `ID: \`${quoteId}\`\n`;

            const progress = submittedGroups.size;
            const total = requiredTypes.length;
            responseText += `ความคืบหน้า: ${progress}/${total} รายการ\n`;
            responseText += `------------------------\n\n`;

            DOCUMENT_CATEGORIES.forEach(category => {
                responseText += `*${category.name}*\n`;
                category.types.forEach(type => {
                    const docs = submittedGroups.get(type.id);
                    if (docs && docs.length > 0) {
                        if (docs.length === 1) {
                            responseText += `✅ ${type.name} ([เปิดดู](${docs[0].file_url}))\n`;
                        } else {
                            // Show multiple files if they exist
                            responseText += `✅ ${type.name} (${docs.length} ไฟล์):\n`;
                            docs.forEach((d, idx) => {
                                responseText += `     └ [ไฟล์ที่ ${idx + 1}](${d.file_url})\n`;
                            });
                        }
                    } else {
                        responseText += `❌ ${type.name}\n`;
                    }
                });
                responseText += `\n`;
            });

            responseText += `\nกรุณาอัปโหลดเอกสารที่เหลือผ่านระบบหลักครับ`;

            await sendTelegramMessage(chatId, responseText, 'Markdown');
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function sendTelegramMessage(chatId: number, text: string, parseMode?: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode
            })
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to send Telegram message:', error);
        }
    } catch (err) {
        console.error('Error sending Telegram message:', err);
    }
}
