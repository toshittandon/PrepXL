// Typography components with consistent styling

export const Heading = ({ 
  level = 1, 
  children, 
  variant = 'default', // 'default', 'display', 'section'
  color = 'default', // 'default', 'muted', 'primary', 'secondary'
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-semibold leading-tight';
  
  const levelClasses = {
    1: 'text-3xl lg:text-4xl',
    2: 'text-2xl lg:text-3xl',
    3: 'text-xl lg:text-2xl',
    4: 'text-lg lg:text-xl',
    5: 'text-base lg:text-lg',
    6: 'text-sm lg:text-base'
  };

  const variantClasses = {
    default: '',
    display: 'font-bold tracking-tight',
    section: 'font-medium tracking-wide'
  };

  const colorClasses = {
    default: 'text-gray-900',
    muted: 'text-gray-600',
    primary: 'text-blue-600',
    secondary: 'text-gray-700'
  };

  const Tag = `h${level}`;
  const classes = `
    ${baseClasses} 
    ${levelClasses[level]} 
    ${variantClasses[variant]} 
    ${colorClasses[color]} 
    ${className}
  `.trim();

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};

export const Text = ({ 
  size = 'base', // 'xs', 'sm', 'base', 'lg', 'xl'
  weight = 'normal', // 'light', 'normal', 'medium', 'semibold', 'bold'
  color = 'default', // 'default', 'muted', 'light', 'primary', 'secondary', 'success', 'warning', 'danger'
  align = 'left', // 'left', 'center', 'right', 'justify'
  children,
  className = '',
  as = 'p',
  ...props
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const colorClasses = {
    default: 'text-gray-900',
    muted: 'text-gray-600',
    light: 'text-gray-500',
    primary: 'text-blue-600',
    secondary: 'text-gray-700',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  const Tag = as;
  const classes = `
    ${sizeClasses[size]} 
    ${weightClasses[weight]} 
    ${colorClasses[color]} 
    ${alignClasses[align]} 
    ${className}
  `.trim();

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};

export const Label = ({ 
  children, 
  required = false,
  size = 'sm',
  weight = 'medium',
  className = '',
  htmlFor,
  ...props 
}) => {
  return (
    <Text
      as="label"
      size={size}
      weight={weight}
      color="default"
      className={`block ${className}`}
      htmlFor={htmlFor}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1">*</span>
      )}
    </Text>
  );
};

export const Caption = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <Text
      size="xs"
      color="muted"
      className={className}
      {...props}
    >
      {children}
    </Text>
  );
};

export const Code = ({ 
  children, 
  inline = true,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-mono bg-gray-100 text-gray-800';
  
  if (inline) {
    return (
      <code 
        className={`${baseClasses} px-1.5 py-0.5 rounded text-sm ${className}`}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <pre 
      className={`${baseClasses} p-4 rounded-lg overflow-x-auto text-sm ${className}`}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
};

export const Link = ({ 
  children, 
  variant = 'default', // 'default', 'button', 'subtle'
  size = 'base',
  className = '',
  ...props 
}) => {
  const variantClasses = {
    default: 'text-blue-600 hover:text-blue-800 underline hover:no-underline',
    button: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded',
    subtle: 'text-gray-600 hover:text-gray-900'
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg'
  };

  return (
    <a 
      className={`
        transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      {children}
    </a>
  );
};

// Utility component for consistent spacing
export const Spacer = ({ 
  size = 'default', // 'xs', 'sm', 'default', 'lg', 'xl', '2xl'
  axis = 'y' // 'x', 'y'
}) => {
  const sizeClasses = {
    xs: axis === 'y' ? 'h-2' : 'w-2',
    sm: axis === 'y' ? 'h-4' : 'w-4',
    default: axis === 'y' ? 'h-6' : 'w-6',
    lg: axis === 'y' ? 'h-8' : 'w-8',
    xl: axis === 'y' ? 'h-12' : 'w-12',
    '2xl': axis === 'y' ? 'h-16' : 'w-16'
  };

  return <div className={sizeClasses[size]} />;
};