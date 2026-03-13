      tailwind.config = {
        theme: {
          extend: {
            colors: {
              iosBg: "#F2F2F7", iosCard: "#FFFFFF", iosBlue: "#007AFF", iosGreen: "#34C759", iosOrange: "#FF9500", iosRed: "#FF3B30", textMain: "#1C1C1E", textLight: "#8E8E93",
            },
            fontFamily: { sans: ["Inter", "-apple-system", "system-ui", "sans-serif"], },
            boxShadow: { 'ios': '0 4px 20px rgba(0,0,0,0.05)', 'ios-float': '0 10px 40px rgba(0,0,0,0.12)', 'ios-modal': '0 -10px 40px rgba(0,0,0,0.15)' },
            transitionTimingFunction: { 'apple': 'cubic-bezier(0.32, 0.72, 0, 1)', 'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
          },
        },
      };
