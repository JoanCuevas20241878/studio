'use server';
import { config } from 'dotenv';
config();

// Esto importa y registra los flujos de IA para que Genkit los encuentre.
import './flows/suggest-category-flow';
