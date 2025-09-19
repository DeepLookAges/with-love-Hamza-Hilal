import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (file: File) => {
    return new Promise<{ mimeType: string; data: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error('Failed to read file as base64 string.'));
            }
            const base64String = reader.result.split(',')[1];
            resolve({
                mimeType: file.type,
                data: base64String,
            });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export const generateStoryImage = async (
    prompt: string, 
    files: File[],
    cameraStyle: string,
    lightingStyle: string
): Promise<string> => {
    try {
        const imagePartsFromFiles = await Promise.all(
            files.map(file => fileToGenerativePart(file))
        );

        const imagePartsForApi = imagePartsFromFiles.map(part => ({
            inlineData: { data: part.data, mimeType: part.mimeType }
        }));

        let stylePrompt = '';
        if (cameraStyle && cameraStyle !== 'افتراضي') {
            stylePrompt += `, with a ${cameraStyle} camera style`;
        }
        if (lightingStyle && lightingStyle !== 'افتراضي') {
            stylePrompt += `, using ${lightingStyle} lighting`;
        }
        
        const fullPrompt = `Re-imagine the provided image(s) with this theme: "${prompt}"${stylePrompt}. Output only the final image, with no accompanying text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    ...imagePartsForApi,
                    {
                        text: fullPrompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                ],
            },
        });
        
        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (imageResponsePart && imageResponsePart.inlineData) {
            return imageResponsePart.inlineData.data;
        } else {
            console.error("Gemini response did not contain an image:", JSON.stringify(response, null, 2));
            
            const blockReason = response.promptFeedback?.blockReason;
            let errorMessage = "فشل الذكاء الاصطناعي في إنشاء الصورة.";

            if (blockReason === 'PROHIBITED_CONTENT' || blockReason) {
                errorMessage = "تم حظر الطلب بسبب سياسات المحتوى. يرجى تعديل الوصف أو استخدام صورة مختلفة.";
            } else {
                errorMessage += " حاول مرة أخرى بوصف مختلف.";
            }
            
            const textResponse = response.text;
            if (textResponse && textResponse.trim()) {
                errorMessage += ` (الرد النصي: ${textResponse.trim()})`;
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        if (error instanceof Error) {
            throw error; 
        }
        throw new Error("حدث خطأ غير متوقع أثناء إنشاء الصورة. يرجى التحقق من الكونسول.");
    }
};