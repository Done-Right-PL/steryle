const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export const formatINR = (n: number): string => inr.format(n)

export const formatCount = (n: number): string => new Intl.NumberFormat('en-IN').format(n)
