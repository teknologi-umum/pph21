export type CalculateTaxResult = {
  taxRateCategory: TaxRateCategory
  employerInsuranceContribution: EmployerInsuranceContribution
  employeeInsuranceContribution: EmployeeInsuranceContribution
  occupationalExpense: number
  netMonthlyIncome: number
  netYearlyIncome: number
  nonTaxableIncome: number
  taxableIncome: number
  regularMonthTax: number
  bonusMonthTax: number
  decemberMonthTax: number
  totalTax: number
}

export enum TaxpayerStatus {
  TK0 = "TK/0",
  TK1 = "TK/1",
  TK2 = "TK/2",
  TK3 = "TK/3",
  K0 = "K/0",
  K1 = "K/1",
  K2 = "K/2",
  K3 = "K/3",
}

export function toTaxPayerStatus(status: string): TaxpayerStatus {
  let result = TaxpayerStatus.TK0
  if (Object.values(TaxpayerStatus).includes(status as TaxpayerStatus)) {
    result = status as TaxpayerStatus;
  }
  return result
}

// Calculate PPh21 based on PP 58/2023. Only covers January-December simulation.
export function calculateTax(salary: number, bonus: number, status: TaxpayerStatus): CalculateTaxResult {
  const taxRateCategory = getTaxRateCategoryByTaxpayerStatus(status)
  const taxRates = getTaxRatesByCategory(taxRateCategory)

  const employerInsuranceContribution = calculateEmployerInsuranceContribution(salary)
  const employeeInsuranceContribution = calculateEmployeeInsuranceContribution(salary)
  const employeeDeduction = Object.values(employeeInsuranceContribution).reduce((accumulator, value) => accumulator + value)
  const employerAddition = Object.values(employerInsuranceContribution).reduce((accumulator, value) => accumulator + value)

  const grossMonthlyIncome = salary + employerAddition
  const occupationalExpense = Math.min(grossMonthlyIncome * 0.05, 500_000)
  const netMonthlyIncome = salary + employerAddition - employeeDeduction - occupationalExpense
  const netYearlyIncome = netMonthlyIncome * 12 + bonus
  const nonTaxableIncome = getNonTaxableIncomeByTaxpayerStatus(status)
  const taxableIncome = netYearlyIncome - nonTaxableIncome

  if (taxableIncome <= 0) {
    return {
      taxRateCategory,
      employerInsuranceContribution,
      employeeInsuranceContribution,
      occupationalExpense,
      netMonthlyIncome,
      netYearlyIncome,
      nonTaxableIncome,
      taxableIncome: 0,
      regularMonthTax: 0,
      bonusMonthTax: 0,
      decemberMonthTax: 0,
      totalTax: 0
    }
  }

  const regularMonthTaxRate = taxRates.find(taxRate => taxRate.minAmount <= netMonthlyIncome)!
  const regularMonthTax = salary * regularMonthTaxRate.rate

  const bonusMonthIncome = netMonthlyIncome + bonus
  const bonusMonthTaxRate = taxRates.find(taxRate => taxRate.minAmount <= bonusMonthIncome)!
  const bonusMonthTax = bonusMonthIncome * bonusMonthTaxRate.rate

  const decemberMonthTax = calculateYearlyTax(taxableIncome) - regularMonthTax * 10 - bonusMonthTax

  const totalTax = regularMonthTax * 10 + bonusMonthTax + decemberMonthTax

  return {
    taxRateCategory,
    employerInsuranceContribution,
    employeeInsuranceContribution,
    occupationalExpense,
    netMonthlyIncome,
    netYearlyIncome,
    nonTaxableIncome,
    taxableIncome,
    regularMonthTax,
    bonusMonthTax,
    decemberMonthTax,
    totalTax,
  }
}

const maxBpjskesSubscription = 12_000_000
const maxJpSubscription = 9_559_600

type EmployerInsuranceContribution = {
  jkk: number
  jkm: number
  bpjskes: number
}

function calculateEmployerInsuranceContribution(salary: number): EmployerInsuranceContribution {
  const jkk = salary * 0.0024
  const jkm = salary * 0.003
  const bpjskes = Math.min(salary, maxBpjskesSubscription) * 0.04

  return {
    jkk,
    jkm,
    bpjskes,
  }
}

type EmployeeInsuranceContribution = {
  jht: number
  jp: number
}

function calculateEmployeeInsuranceContribution(salary: number): EmployeeInsuranceContribution {
  const jht = salary * 0.02
  const jp = Math.min(salary, maxJpSubscription) * 0.01

  return {
    jht,
    jp,
  }
}

// Calculate PPh21 based on UU 7/2021 given a TAXABLE INCOME, WHICH MEANS IT'S ALREADY DEDUCTED BY PTKP.
function calculateYearlyTax(taxableIncome: number): number {
  const taxBrackets = [
    { limit: 60_000_000, rate: 0.05 },
    { limit: 250_000_000, rate: 0.15 },
    { limit: 500_000_000, rate: 0.25 },
    { limit: 5_000_000_000, rate: 0.30 },
    { limit: Infinity, rate: 0.35 }
  ]

  let remaining = taxableIncome
  let result = 0
  for (const { limit, rate } of taxBrackets) {
    if (remaining <= 0) { break }
    const currentBracketAmount = Math.min(remaining, limit)
    const currentBracketTax = currentBracketAmount * rate;
    result += currentBracketTax
    remaining -= currentBracketAmount
  }

  return result
}

function getNonTaxableIncomeByTaxpayerStatus(status: TaxpayerStatus): number {
  switch (status) {
    case TaxpayerStatus.TK0:
      return 54_000_000;
    case TaxpayerStatus.TK1:
      return 58_500_000;
    case TaxpayerStatus.TK2:
      return 63_000_000;
    case TaxpayerStatus.TK3:
      return 67_500_000;
    case TaxpayerStatus.K0:
      return 58_500_000;
    case TaxpayerStatus.K1:
      return 63_000_000;
    case TaxpayerStatus.K2:
      return 67_500_000;
    case TaxpayerStatus.K3:
      return 72_000_000;
  }
}

enum TaxRateCategory {
  A = "A",
  B = "B",
  C = "C",
}

function getTaxRateCategoryByTaxpayerStatus(status: TaxpayerStatus): TaxRateCategory {
  switch (status) {
    case TaxpayerStatus.TK0:
    case TaxpayerStatus.TK1:
    case TaxpayerStatus.K0:
      return TaxRateCategory.A
    case TaxpayerStatus.TK2:
    case TaxpayerStatus.TK3:
    case TaxpayerStatus.K1:
    case TaxpayerStatus.K2:
      return TaxRateCategory.B
    case TaxpayerStatus.K3:
      return TaxRateCategory.C
  }
}

type TaxRate = {
  minAmount: number;
  rate: number;
}

function getTaxRatesByCategory(category: TaxRateCategory): TaxRate[] {
  switch (category) {
    case TaxRateCategory.A:
      return [
        { minAmount: 1_400_000_001, rate: 34 },
        { minAmount: 910_000_001, rate: 0.33 },
        { minAmount: 695_000_001, rate: 0.32 },
        { minAmount: 550_000_001, rate: 0.31 },
        { minAmount: 454_000_001, rate: 0.30 },
        { minAmount: 337_000_001, rate: 0.29 },
        { minAmount: 206_000_001, rate: 0.28 },
        { minAmount: 157_000_001, rate: 0.27 },
        { minAmount: 125_000_001, rate: 0.26 },
        { minAmount: 103_000_001, rate: 0.25 },
        { minAmount: 89_000_001, rate: 0.24 },
        { minAmount: 77_500_001, rate: 0.23 },
        { minAmount: 68_600_001, rate: 0.22 },
        { minAmount: 62_200_001, rate: 0.21 },
        { minAmount: 56_300_001, rate: 0.20 },
        { minAmount: 51_400_001, rate: 0.19 },
        { minAmount: 47_800_001, rate: 0.18 },
        { minAmount: 43_850_001, rate: 0.17 },
        { minAmount: 39_100_001, rate: 0.16 },
        { minAmount: 35_400_001, rate: 0.15 },
        { minAmount: 32_400_001, rate: 0.14 },
        { minAmount: 30_050_001, rate: 0.13 },
        { minAmount: 28_000_001, rate: 0.12 },
        { minAmount: 26_450_001, rate: 0.11 },
        { minAmount: 24_150_001, rate: 0.10 },
        { minAmount: 19_750_001, rate: 0.09 },
        { minAmount: 16_950_001, rate: 0.08 },
        { minAmount: 15_100_001, rate: 0.07 },
        { minAmount: 13_750_001, rate: 0.06 },
        { minAmount: 12_500_001, rate: 0.05 },
        { minAmount: 11_600_001, rate: 0.04 },
        { minAmount: 11_050_001, rate: 0.035 },
        { minAmount: 10_700_001, rate: 0.03 },
        { minAmount: 10_350_001, rate: 0.025 },
        { minAmount: 10_050_001, rate: 0.0225 },
        { minAmount: 9_650_001, rate: 0.02 },
        { minAmount: 8_550_001, rate: 0.0175 },
        { minAmount: 7_500_001, rate: 0.015 },
        { minAmount: 6_750_001, rate: 0.0125 },
        { minAmount: 6_300_001, rate: 0.01 },
        { minAmount: 5_950_001, rate: 0.0075 },
        { minAmount: 5_650_001, rate: 0.005 },
        { minAmount: 5_400_001, rate: 0.0025 },
        { minAmount: 0, rate: 0 },
      ]
    case TaxRateCategory.B:
      return [
        { minAmount: 1_405_000_001, rate: 0.34 },
        { minAmount: 957_000_001, rate: 0.33 },
        { minAmount: 704_000_001, rate: 0.32 },
        { minAmount: 555_000_001, rate: 0.31 },
        { minAmount: 459_000_001, rate: 0.30 },
        { minAmount: 374_000_001, rate: 0.29 },
        { minAmount: 211_000_001, rate: 0.28 },
        { minAmount: 163_000_001, rate: 0.27 },
        { minAmount: 129_000_001, rate: 0.26 },
        { minAmount: 109_000_001, rate: 0.25 },
        { minAmount: 93_000_001, rate: 0.24 },
        { minAmount: 80_000_001, rate: 0.23 },
        { minAmount: 71_000_001, rate: 0.22 },
        { minAmount: 64_000_001, rate: 0.21 },
        { minAmount: 58_500_001, rate: 0.21 },
        { minAmount: 53_800_001, rate: 0.19 },
        { minAmount: 49_500_001, rate: 0.18 },
        { minAmount: 45_800_001, rate: 0.17 },
        { minAmount: 41_100_001, rate: 0.16 },
        { minAmount: 37_100_001, rate: 0.15 },
        { minAmount: 33_950_001, rate: 0.14 },
        { minAmount: 31_450_001, rate: 0.13 },
        { minAmount: 29_350_001, rate: 0.12 },
        { minAmount: 27_700_001, rate: 0.11 },
        { minAmount: 26_000_001, rate: 0.10 },
        { minAmount: 21_850_001, rate: 0.09 },
        { minAmount: 18_450_001, rate: 0.08 },
        { minAmount: 16_400_001, rate: 0.07 },
        { minAmount: 14_950_001, rate: 0.06 },
        { minAmount: 13_600_001, rate: 0.05 },
        { minAmount: 12_600_001, rate: 0.04 },
        { minAmount: 11_600_001, rate: 0.03 },
        { minAmount: 11_250_001, rate: 0.025 },
        { minAmount: 10_750_001, rate: 0.02 },
        { minAmount: 9_200_001, rate: 0.015 },
        { minAmount: 7_300_001, rate: 0.01 },
        { minAmount: 6_850_001, rate: 0.0075 },
        { minAmount: 6_500_001, rate: 0.005 },
        { minAmount: 6_200_001, rate: 0.0025 },
        { minAmount: 0, rate: 0 },
      ]
    case TaxRateCategory.C:
      return [
        { minAmount: 1_419_000_001, rate: 0.34 },
        { minAmount: 965_000_001, rate: 0.33 },
        { minAmount: 709_000_001, rate: 0.32 },
        { minAmount: 561_000_001, rate: 0.31 },
        { minAmount: 463_000_001, rate: 0.30 },
        { minAmount: 390_000_001, rate: 0.29 },
        { minAmount: 221_000_001, rate: 0.28 },
        { minAmount: 169_000_001, rate: 0.27 },
        { minAmount: 134_000_001, rate: 0.26 },
        { minAmount: 110_000_001, rate: 0.25 },
        { minAmount: 95_600_001, rate: 0.24 },
        { minAmount: 83_200_001, rate: 0.23 },
        { minAmount: 74_500_001, rate: 0.22 },
        { minAmount: 66_700_001, rate: 0.21 },
        { minAmount: 60_400_001, rate: 0.20 },
        { minAmount: 55_800_001, rate: 0.19 },
        { minAmount: 51_200_001, rate: 0.18 },
        { minAmount: 47_400_001, rate: 0.17 },
        { minAmount: 43_000_001, rate: 0.16 },
        { minAmount: 38_900_001, rate: 0.15 },
        { minAmount: 35_400_001, rate: 0.14 },
        { minAmount: 32_600_001, rate: 0.13 },
        { minAmount: 30_100_001, rate: 0.12 },
        { minAmount: 28_100_001, rate: 0.11 },
        { minAmount: 26_600_001, rate: 0.10 },
        { minAmount: 22_700_001, rate: 0.09 },
        { minAmount: 19_500_001, rate: 0.08 },
        { minAmount: 17_050_001, rate: 0.07 },
        { minAmount: 15_550_001, rate: 0.06 },
        { minAmount: 14_150_001, rate: 0.05 },
        { minAmount: 12_950_001, rate: 0.04 },
        { minAmount: 12_050_001, rate: 0.03 },
        { minAmount: 11_200_001, rate: 0.02 },
        { minAmount: 10_950_001, rate: 0.0175 },
        { minAmount: 9_800_001, rate: 0.015 },
        { minAmount: 8_850_001, rate: 0.0125 },
        { minAmount: 7_800_001, rate: 0.01 },
        { minAmount: 7_350_001, rate: 0.0075 },
        { minAmount: 6_950_001, rate: 0.005 },
        { minAmount: 6_600_001, rate: 0.0025 },
        { minAmount: 0, rate: 0 },
      ]
  }
}

export function localise(num: number) {
	return num.toLocaleString("id-ID", { style: "currency", currency: "IDR" })
}