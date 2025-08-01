const Container = ({ 
  children, 
  size = 'default', // 'sm', 'default', 'lg', 'xl', 'full'
  padding = 'default', // 'none', 'sm', 'default', 'lg'
  className = ''
}) => {
  const sizes = {
    sm: 'max-w-2xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full'
  };

  const paddings = {
    none: '',
    sm: 'px-4 sm:px-6',
    default: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  };

  return (
    <div className={`
      mx-auto w-full ${sizes[size]} ${paddings[padding]} ${className}
    `}>
      {children}
    </div>
  );
};

// Grid system components
export const Grid = ({ 
  children, 
  cols = 1, // 1, 2, 3, 4, 6, 12
  gap = 'default', // 'none', 'sm', 'default', 'lg', 'xl'
  responsive = true,
  className = ''
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    6: responsive ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-6',
    12: responsive ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12' : 'grid-cols-12'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    default: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={`
      grid ${colClasses[cols]} ${gapClasses[gap]} ${className}
    `}>
      {children}
    </div>
  );
};

export const GridItem = ({ 
  children, 
  colSpan = 1, // 1-12
  rowSpan = 1, // 1-6
  className = ''
}) => {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12'
  };

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
    4: 'row-span-4',
    5: 'row-span-5',
    6: 'row-span-6'
  };

  return (
    <div className={`
      ${colSpanClasses[colSpan]} ${rowSpanClasses[rowSpan]} ${className}
    `}>
      {children}
    </div>
  );
};

// Flex layout components
export const Flex = ({ 
  children, 
  direction = 'row', // 'row', 'col', 'row-reverse', 'col-reverse'
  justify = 'start', // 'start', 'end', 'center', 'between', 'around', 'evenly'
  align = 'stretch', // 'start', 'end', 'center', 'baseline', 'stretch'
  wrap = false,
  gap = 'default',
  className = ''
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    default: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={`
      flex ${directionClasses[direction]} ${justifyClasses[justify]} 
      ${alignClasses[align]} ${wrap ? 'flex-wrap' : ''} 
      ${gapClasses[gap]} ${className}
    `}>
      {children}
    </div>
  );
};

// Stack component for vertical layouts
export const Stack = ({ 
  children, 
  spacing = 'default', // 'none', 'sm', 'default', 'lg', 'xl'
  className = ''
}) => {
  const spacingClasses = {
    none: 'space-y-0',
    sm: 'space-y-2',
    default: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

export default Container;