import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';

interface VTButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const VTButton: React.FC<VTButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { primaryColor } = useTheme();
  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (isDisabled) return Colors.disabledGray;
    switch (variant) {
      case 'secondary': return Colors.ButtonPrimaryRight;
      case 'outline': return 'transparent';
      default: return primaryColor || Colors.ButtonPrimaryColor;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return Colors.disabledText;
    switch (variant) {
      case 'outline': return primaryColor || Colors.ButtonPrimaryColor;
      default: return Colors.BGColor;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: primaryColor || Colors.ButtonPrimaryColor,
        },
        style,
        isDisabled && {
          backgroundColor: Colors.disabledGray,
          borderColor: 'transparent',
          opacity: 0.6,
          shadowOpacity: 0,
          elevation: 0,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor() },
            textStyle,
            isDisabled && { color: Colors.disabledText },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
  },
});

export default VTButton;
