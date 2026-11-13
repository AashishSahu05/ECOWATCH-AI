import { Type, Schema } from "@google/genai";

export const SEGREGATION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Concise 1-2 sentence overview of the detected waste objects and their segregation requirements.",
    },
    overallCategory: {
      type: Type.STRING,
      enum: ["wet", "dry", "recyclable", "hazardous", "mixed"],
      description: "Overall categorization of the waste composition in the image.",
    },
    detectedObjects: {
      type: Type.ARRAY,
      description: "List of discrete discarded objects detected in the image.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: "Common name of the object (e.g. 'Crushed PET Water Bottle', 'Banana Peel', 'Spent Alkaline Battery').",
          },
          material: {
            type: Type.STRING,
            description: "Specific material composition (e.g. 'Polyethylene Terephthalate #1', 'Organic Fruit Matter', 'Corrosive Zinc-Carbon').",
          },
          category: {
            type: Type.STRING,
            enum: ["wet", "dry", "recyclable", "hazardous"],
            description: "The primary municipal waste segregation stream.",
          },
          identificationConfidence: {
            type: Type.NUMBER,
            description: "Visual identification confidence score as an honest float between 0.0 and 1.0 based strictly on visual clarity.",
          },
          classificationCertainty: {
            type: Type.STRING,
            enum: ["high", "medium", "uncertain"],
            description: "Certainty level regarding municipal stream assignment. Must be 'uncertain' if packaging is dirty, obscured, or mixed.",
          },
          disposalBin: {
            type: Type.STRING,
            description: "The recommended designated bin or collection channel (e.g. 'Green Organic Bin', 'Blue Dry / Recyclable Bin', 'Authorized E-Waste Collection Point').",
          },
          disposalInstructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Actionable, ordered citizen instructions (e.g. 'Rinse residual liquid', 'Flatten container', 'Keep cap fastened').",
          },
          hazardWarning: {
            type: Type.STRING,
            description: "Specific cautionary safety advice if the item is hazardous, bio-waste, sharp, or toxic. Null if item is harmless.",
          },
          requiresManualVerification: {
            type: Type.BOOLEAN,
            description: "True if the item cannot be guaranteed by optical analysis alone or presents potential contamination risks.",
          },
          box2d: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Normalized bounding box coordinates [ymin, xmin, ymax, xmax] in integer scale from 0 to 1000.",
          },
        },
        required: [
          "label",
          "material",
          "category",
          "identificationConfidence",
          "classificationCertainty",
          "disposalBin",
          "disposalInstructions",
          "requiresManualVerification",
        ],
      },
    },
  },
  required: ["summary", "overallCategory", "detectedObjects"],
};
