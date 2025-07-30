// Mock ZAI SDK to prevent Kubernetes connection errors
const mockZAI = {
  create: async () => ({
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content: 'Mock response' } }] })
      }
    },
    images: {
      generations: {
        create: async () => ({ data: [{ base64: 'mock-base64-image' }] })
      }
    },
    functions: {
      invoke: async () => ({ result: 'Mock function result' })
    }
  })
};

export default mockZAI;