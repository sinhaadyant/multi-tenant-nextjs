// Mock for Next.js image component
module.exports = {
  __esModule: true,
  default: (props) => {
    return { ...props, type: 'img' }
  },
} 