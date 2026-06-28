const className = `
  w-full h-10 min-w-5 p-2.5 rounded-md
  bg-input/40
  border border-input

  focus-visible:ring-1
  focus-visible:ring-ring

  aria-invalid:border-destructive
  aria-invalid:ring-destructive/20
  aria-invalid:ring-0
  aria-invalid:focus-visible:ring-2
`;


export const fieldStyles = className

/*export const fieldStyles = `

  w-full min-w-5 p-1.5 rounded-md
  border border-input bg-transparent
  text-base
  transition-colors
  outline-none
  placeholder:text-muted-foreground
  focus-visible:border-ring
  focus-visible:ring-0.5
  focus-visible:ring-ring/50
  disabled:cursor-not-allowed
  disabled:bg-input/50
  disabled:opacity-50
  aria-invalid:border-destructive
  aria-invalid:ring-0.5
  aria-invalid:ring-destructive/20
  md:text-sm
  dark:bg-input/30
  dark:disabled:bg-input/80
  dark:aria-invalid:border-destructive/50
  dark:aria-invalid:ring-destructive/40

`;*/