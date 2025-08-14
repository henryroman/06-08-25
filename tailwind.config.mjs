/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
  "colors": {
    "primary": {
      "50": "#fdf2f8",
      "100": "#fce7f3",
      "200": "#fbcfe8",
      "300": "#f9a8d4",
      "400": "#f472b6",
      "500": "#ec4899",
      "600": "#db2777",
      "700": "#be185d",
      "800": "#9d174d",
      "900": "#831843"
    },
    "secondary": {
      "50": "#faf5ff",
      "100": "#f3e8ff",
      "200": "#e9d5ff",
      "300": "#d8b4fe",
      "400": "#c084fc",
      "500": "#a855f7",
      "600": "#9333ea",
      "700": "#7c3aed",
      "800": "#6b21a8",
      "900": "#581c87"
    },
    "neutral": {
      "50": "#fafafa",
      "100": "#f4f4f5",
      "200": "#e4e4e7",
      "300": "#d4d4d8",
      "400": "#a1a1aa",
      "500": "#71717a",
      "600": "#52525b",
      "700": "#3f3f46",
      "800": "#27272a",
      "900": "#18181b"
    },
    "success": {
      "50": "#f0fdf4",
      "100": "#dcfce7",
      "200": "#bbf7d0",
      "300": "#86efac",
      "400": "#4ade80",
      "500": "#22c55e",
      "600": "#16a34a",
      "700": "#15803d",
      "800": "#166534",
      "900": "#14532d",
      "950": "#052e16"
    },
    "warning": {
      "50": "#fffbeb",
      "100": "#fef3c7",
      "200": "#fde68a",
      "300": "#fcd34d",
      "400": "#fbbf24",
      "500": "#f59e0b",
      "600": "#d97706",
      "700": "#b45309",
      "800": "#92400e",
      "900": "#78350f",
      "950": "#451a03"
    },
    "error": {
      "50": "#fef2f2",
      "100": "#fee2e2",
      "200": "#fecaca",
      "300": "#fca5a5",
      "400": "#f87171",
      "500": "#ef4444",
      "600": "#dc2626",
      "700": "#b91c1c",
      "800": "#991b1b",
      "900": "#7f1d1d",
      "950": "#450a0a"
    }
  },
  "fontFamily": {
    "sans": [
      "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif"
    ],
    "serif": [
      "Georgia",
      "Cambria",
      "Times New Roman",
      "Times",
      "serif"
    ],
    "mono": [
      "ui-monospace",
      "SFMono-Regular",
      "Menlo",
      "Monaco",
      "Consolas",
      "Liberation Mono",
      "Courier New",
      "monospace"
    ]
  },
  "borderRadius": {
    "sm": "0.375rem",
    "md": "0.5rem",
    "lg": "0.75rem",
    "xl": "1rem",
    "2xl": "1.5rem"
  },
  "boxShadow": {
    "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "md": "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    "glow": "0 0 20px #ec489933",
    "glow-lg": "0 0 40px #ec489966",
    "card": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0 0, 0.06)",
    "card-lg": "0 10px 15px -3px rgba(0, 0 0, 0.1), 0 4px 6px -2px rgba(0, 0 0, 0.05)",
    "card-xl": "0 20px 25px -5px rgba(0, 0 0, 0.1), 0 10px 10px -5px rgba(0, 0 0, 0.04)"
  },
  "spacing": {
    "xs": "0.5rem",
    "sm": "1rem",
    "md": "1.5rem",
    "lg": "2rem",
    "xl": "3rem",
    "2xl": "4rem",
    "3xl": "6rem"
  },
  "animation": {
    "fadeIn": "fadeIn 0.5s ease-in-out",
    "slideUp": "slideUp 0.6s ease-out",
    "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
  },
  "keyframes": {
    "fadeIn": {
      "0%": {
        "opacity": "0"
      },
      "100%": {
        "opacity": "1"
      }
    },
    "slideUp": {
      "0%": {
        "opacity": "0",
        "transform": "translateY(20px)"
      },
      "100%": {
        "opacity": "1",
        "transform": "translateY(0)"
      }
    },
    "slideDown": {
      "0%": {
        "opacity": "0",
        "transform": "translateY(-20px)"
      },
      "100%": {
        "opacity": "1",
        "transform": "translateY(0)"
      }
    },
    "slideLeft": {
      "0%": {
        "opacity": "0",
        "transform": "translateX(20px)"
      },
      "100%": {
        "opacity": "1",
        "transform": "translateX(0)"
      }
    },
    "slideRight": {
      "0%": {
        "opacity": "0",
        "transform": "translateX(-20px)"
      },
      "100%": {
        "opacity": "1",
        "transform": "translateX(0)"
      }
    },
    "scaleIn": {
      "0%": {
        "opacity": "0",
        "transform": "scale(0.9)"
      },
      "100%": {
        "opacity": "1",
        "transform": "scale(1)"
      }
    },
    "bounceGentle": {
      "0%, 100%": {
        "transform": "translateY(0)"
      },
      "50%": {
        "transform": "translateY(-10px)"
      }
    },
    "pulseGentle": {
      "0%, 100%": {
        "opacity": "1"
      },
      "50%": {
        "opacity": "0.7"
      }
    }
  },
  "backdropBlur": {
    "xs": "2px"
  },
  "transitionProperty": {
    "height": "height",
    "spacing": "margin, padding"
  }
}
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        "heavenly": {
          "primary": "#ec4899",
          "secondary": "#a855f7",
          "accent": "#f472b6",
          "neutral": "#27272a",
          "base-100": "#ffffff",
          "base-200": "#f4f4f5",
          "base-300": "#e4e4e7",
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};
