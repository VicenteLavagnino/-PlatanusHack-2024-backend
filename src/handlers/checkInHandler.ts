import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import config from "../config/config";
import generateUserContext from "../utils/generateUserContext";

interface CheckInState {
  type: 'MORNING' | 'EVENING';
  step: number;
  sessionStartTime: Date;
}

export class CheckInHandler {
  private state: CheckInState;
  private user: User | null;
  private prisma: PrismaClient;
  private anthropic: Anthropic;
  
  constructor(
    private phoneNumber: string,
    type: 'MORNING' | 'EVENING' = 'EVENING'
  ) {
    this.prisma = new PrismaClient();
    this.anthropic = new Anthropic({
      apiKey: config.claude.apiKey,
    });
    this.user = null;
    this.state = {
      type,
      step: 0,
      sessionStartTime: new Date()
    };
  }

  private async loadUser() {
    this.user = await this.prisma.user.findUnique({
      where: { phoneNumber: this.phoneNumber }
    });

    if (!this.user) {
      throw new Error('User not found');
    }

    await this.prisma.user.update({
      where: { id: this.user.id },
      data: { lastInteraction: new Date() }
    });
  }

  private async generateResponse(message: string): Promise<string[]> {
    const userContext = generateUserContext(this.user);
    const timeOfDay = new Date().getHours() < 12 ? 'mañana' : 
                     new Date().getHours() < 18 ? 'tarde' : 
                     'noche';
  
    const sobrietyDays = this.user?.sobrietyStartDate 
      ? Math.floor((new Date().getTime() - this.user.sobrietyStartDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const prompt = `
      Eres un compañero de apoyo empático y comprensivo que ayuda a personas en su proceso de recuperación del alcohol.
      Tu objetivo es crear un espacio seguro y acogedor para la reflexión y el crecimiento personal.

      CONTEXTO DEL CHECK-IN:
      - Momento del día: Check-in de ${this.state.type.toLowerCase()}
      - Etapa: ${this.state.step + 1} de 3
      - Hora actual: ${timeOfDay}
      - Días en recuperación: ${sobrietyDays}

      INFORMACIÓN DEL USUARIO:
      ${userContext}

      MENSAJE DEL USUARIO:
      "${message}"

      GUÍA DE RESPUESTA:
      1. Validación Emocional:
         - Reconoce sus sentimientos sin juzgar
         - Normaliza sus experiencias
         - Muestra comprensión genuina

      2. Exploración Gentil:
         - Haz preguntas abiertas pero delicadas
         - Permite espacio para la vulnerabilidad
         - Evita presionar o forzar respuestas

      3. Apoyo Práctico:
         - Sugiere estrategias solo si es apropiado
         - Refuerza sus propios mecanismos de afrontamiento
         - Celebra los pequeños logros

      4. Estilo de Comunicación:
         - Usa español chileno natural y cercano
         - Mantén un tono conversacional y amigable
         - Evita lenguaje clínico o demasiado formal
         - Divide tu respuesta en 2-3 mensajes cortos
         ${this.state.step >= 2 ? '- Incluye un mensaje de cierre positivo y esperanzador' : ''}

      IMPORTANTE:
      - Mantén un tono cálido y esperanzador
      - Evita minimizar sus dificultades
      - Refuerza que no están solos en este proceso
      - Reconoce el valor de su esfuerzo por mantenerse sobrio/a
      - Usa lenguaje inclusivo y respetuoso

      Responde como un amigo comprensivo que escucha sin juzgar, manteniendo un equilibrio entre empatía y motivación.
    `;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 250,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const content = response.content.find((c) => c.type === "text")?.text;
      return content ? content.split('\n').filter(line => line.trim()) : [
        "Te escucho y estoy aquí para apoyarte.",
        `Que tengas una buena ${timeOfDay}. Recuerda que no estás solo/a en este proceso.`
      ];
    } catch (error) {
      console.error("Error generating response:", error);
      return [
        "Te escucho y estoy aquí para apoyarte.",
        `Que tengas una buena ${timeOfDay}. Recuerda que no estás solo/a en este proceso.`
      ];
    }
  }

  public async handleMessage(message: string): Promise<string[]> {
    try {
      if (!this.user) {
        await this.loadUser();
      }

      const response = await this.generateResponse(message);
      this.state.step++;

      if (this.state.step >= 3) {
        await this.prisma.user.update({
          where: { id: this.user.id },
          data: { lastInteraction: new Date() }
        });
      }

      return response;
    } catch (error) {
      console.error("Error in handleMessage:", error);
      return ["Disculpa, tuve un problema. ¿Podríamos intentar de nuevo?"];
    }
  }
}