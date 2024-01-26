// src/tax.ts
function toTaxPayerStatus(status) {
  let result = TaxpayerStatus.TK0;
  if (Object.values(TaxpayerStatus).includes(status)) {
    result = status;
  }
  return result;
}
function calculateTax(salary, bonus, status) {
  const taxRateCategory = getTaxRateCategoryByTaxpayerStatus(status);
  const taxRates = getTaxRatesByCategory(taxRateCategory);
  const employerInsuranceContribution = calculateEmployerInsuranceContribution(salary);
  const employeeInsuranceContribution = calculateEmployeeInsuranceContribution(salary);
  const employeeDeduction = Object.values(employeeInsuranceContribution).reduce((accumulator, value) => accumulator + value);
  const employerAddition = Object.values(employerInsuranceContribution).reduce((accumulator, value) => accumulator + value);
  const grossMonthlyIncome = salary + employerAddition;
  const occupationalExpense = Math.min(grossMonthlyIncome * 0.05, 500000);
  const netMonthlyIncome = salary + employerAddition - employeeDeduction - occupationalExpense;
  const netYearlyIncome = netMonthlyIncome * 12 + bonus;
  const nonTaxableIncome = getNonTaxableIncomeByTaxpayerStatus(status);
  const taxableIncome = netYearlyIncome - nonTaxableIncome;
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
    };
  }
  const regularMonthTaxRate = taxRates.find((taxRate) => taxRate.minAmount <= netMonthlyIncome);
  const regularMonthTax = salary * regularMonthTaxRate.rate;
  const bonusMonthIncome = netMonthlyIncome + bonus;
  const bonusMonthTaxRate = taxRates.find((taxRate) => taxRate.minAmount <= bonusMonthIncome);
  const bonusMonthTax = bonusMonthIncome * bonusMonthTaxRate.rate;
  const decemberMonthTax = calculateYearlyTax(taxableIncome) - regularMonthTax * 10 - bonusMonthTax;
  const totalTax = regularMonthTax * 10 + bonusMonthTax + decemberMonthTax;
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
    totalTax
  };
}
var calculateEmployerInsuranceContribution = function(salary) {
  const jkk = salary * 0.0024;
  const jkm = salary * 0.003;
  const bpjskes = Math.min(salary, maxBpjskesSubscription) * 0.04;
  return {
    jkk,
    jkm,
    bpjskes
  };
};
var calculateEmployeeInsuranceContribution = function(salary) {
  const jht = salary * 0.02;
  const jp = Math.min(salary, maxJpSubscription) * 0.01;
  return {
    jht,
    jp
  };
};
var calculateYearlyTax = function(taxableIncome) {
  const taxBrackets = [
    { limit: 60000000, rate: 0.05 },
    { limit: 250000000, rate: 0.15 },
    { limit: 500000000, rate: 0.25 },
    { limit: 5000000000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 }
  ];
  let remaining = taxableIncome;
  let result = 0;
  for (const { limit, rate } of taxBrackets) {
    if (remaining <= 0) {
      break;
    }
    const currentBracketAmount = Math.min(remaining, limit);
    const currentBracketTax = currentBracketAmount * rate;
    result += currentBracketTax;
    remaining -= currentBracketAmount;
  }
  return result;
};
var getNonTaxableIncomeByTaxpayerStatus = function(status) {
  switch (status) {
    case TaxpayerStatus.TK0:
      return 54000000;
    case TaxpayerStatus.TK1:
      return 58500000;
    case TaxpayerStatus.TK2:
      return 63000000;
    case TaxpayerStatus.TK3:
      return 67500000;
    case TaxpayerStatus.K0:
      return 58500000;
    case TaxpayerStatus.K1:
      return 63000000;
    case TaxpayerStatus.K2:
      return 67500000;
    case TaxpayerStatus.K3:
      return 72000000;
  }
};
var getTaxRateCategoryByTaxpayerStatus = function(status) {
  switch (status) {
    case TaxpayerStatus.TK0:
    case TaxpayerStatus.TK1:
    case TaxpayerStatus.K0:
      return TaxRateCategory.A;
    case TaxpayerStatus.TK2:
    case TaxpayerStatus.TK3:
    case TaxpayerStatus.K1:
    case TaxpayerStatus.K2:
      return TaxRateCategory.B;
    case TaxpayerStatus.K3:
      return TaxRateCategory.C;
  }
};
var getTaxRatesByCategory = function(category) {
  switch (category) {
    case TaxRateCategory.A:
      return [
        { minAmount: 1400000001, rate: 34 },
        { minAmount: 910000001, rate: 0.33 },
        { minAmount: 695000001, rate: 0.32 },
        { minAmount: 550000001, rate: 0.31 },
        { minAmount: 454000001, rate: 0.3 },
        { minAmount: 337000001, rate: 0.29 },
        { minAmount: 206000001, rate: 0.28 },
        { minAmount: 157000001, rate: 0.27 },
        { minAmount: 125000001, rate: 0.26 },
        { minAmount: 103000001, rate: 0.25 },
        { minAmount: 89000001, rate: 0.24 },
        { minAmount: 77500001, rate: 0.23 },
        { minAmount: 68600001, rate: 0.22 },
        { minAmount: 62200001, rate: 0.21 },
        { minAmount: 56300001, rate: 0.2 },
        { minAmount: 51400001, rate: 0.19 },
        { minAmount: 47800001, rate: 0.18 },
        { minAmount: 43850001, rate: 0.17 },
        { minAmount: 39100001, rate: 0.16 },
        { minAmount: 35400001, rate: 0.15 },
        { minAmount: 32400001, rate: 0.14 },
        { minAmount: 30050001, rate: 0.13 },
        { minAmount: 28000001, rate: 0.12 },
        { minAmount: 26450001, rate: 0.11 },
        { minAmount: 24150001, rate: 0.1 },
        { minAmount: 19750001, rate: 0.09 },
        { minAmount: 16950001, rate: 0.08 },
        { minAmount: 15100001, rate: 0.07 },
        { minAmount: 13750001, rate: 0.06 },
        { minAmount: 12500001, rate: 0.05 },
        { minAmount: 11600001, rate: 0.04 },
        { minAmount: 11050001, rate: 0.035 },
        { minAmount: 10700001, rate: 0.03 },
        { minAmount: 10350001, rate: 0.025 },
        { minAmount: 10050001, rate: 0.0225 },
        { minAmount: 9650001, rate: 0.02 },
        { minAmount: 8550001, rate: 0.0175 },
        { minAmount: 7500001, rate: 0.015 },
        { minAmount: 6750001, rate: 0.0125 },
        { minAmount: 6300001, rate: 0.01 },
        { minAmount: 5950001, rate: 0.0075 },
        { minAmount: 5650001, rate: 0.005 },
        { minAmount: 5400001, rate: 0.0025 },
        { minAmount: 0, rate: 0 }
      ];
    case TaxRateCategory.B:
      return [
        { minAmount: 1405000001, rate: 0.34 },
        { minAmount: 957000001, rate: 0.33 },
        { minAmount: 704000001, rate: 0.32 },
        { minAmount: 555000001, rate: 0.31 },
        { minAmount: 459000001, rate: 0.3 },
        { minAmount: 374000001, rate: 0.29 },
        { minAmount: 211000001, rate: 0.28 },
        { minAmount: 163000001, rate: 0.27 },
        { minAmount: 129000001, rate: 0.26 },
        { minAmount: 109000001, rate: 0.25 },
        { minAmount: 93000001, rate: 0.24 },
        { minAmount: 80000001, rate: 0.23 },
        { minAmount: 71000001, rate: 0.22 },
        { minAmount: 64000001, rate: 0.21 },
        { minAmount: 58500001, rate: 0.21 },
        { minAmount: 53800001, rate: 0.19 },
        { minAmount: 49500001, rate: 0.18 },
        { minAmount: 45800001, rate: 0.17 },
        { minAmount: 41100001, rate: 0.16 },
        { minAmount: 37100001, rate: 0.15 },
        { minAmount: 33950001, rate: 0.14 },
        { minAmount: 31450001, rate: 0.13 },
        { minAmount: 29350001, rate: 0.12 },
        { minAmount: 27700001, rate: 0.11 },
        { minAmount: 26000001, rate: 0.1 },
        { minAmount: 21850001, rate: 0.09 },
        { minAmount: 18450001, rate: 0.08 },
        { minAmount: 16400001, rate: 0.07 },
        { minAmount: 14950001, rate: 0.06 },
        { minAmount: 13600001, rate: 0.05 },
        { minAmount: 12600001, rate: 0.04 },
        { minAmount: 11600001, rate: 0.03 },
        { minAmount: 11250001, rate: 0.025 },
        { minAmount: 10750001, rate: 0.02 },
        { minAmount: 9200001, rate: 0.015 },
        { minAmount: 7300001, rate: 0.01 },
        { minAmount: 6850001, rate: 0.0075 },
        { minAmount: 6500001, rate: 0.005 },
        { minAmount: 6200001, rate: 0.0025 },
        { minAmount: 0, rate: 0 }
      ];
    case TaxRateCategory.C:
      return [
        { minAmount: 1419000001, rate: 0.34 },
        { minAmount: 965000001, rate: 0.33 },
        { minAmount: 709000001, rate: 0.32 },
        { minAmount: 561000001, rate: 0.31 },
        { minAmount: 463000001, rate: 0.3 },
        { minAmount: 390000001, rate: 0.29 },
        { minAmount: 221000001, rate: 0.28 },
        { minAmount: 169000001, rate: 0.27 },
        { minAmount: 134000001, rate: 0.26 },
        { minAmount: 110000001, rate: 0.25 },
        { minAmount: 95600001, rate: 0.24 },
        { minAmount: 83200001, rate: 0.23 },
        { minAmount: 74500001, rate: 0.22 },
        { minAmount: 66700001, rate: 0.21 },
        { minAmount: 60400001, rate: 0.2 },
        { minAmount: 55800001, rate: 0.19 },
        { minAmount: 51200001, rate: 0.18 },
        { minAmount: 47400001, rate: 0.17 },
        { minAmount: 43000001, rate: 0.16 },
        { minAmount: 38900001, rate: 0.15 },
        { minAmount: 35400001, rate: 0.14 },
        { minAmount: 32600001, rate: 0.13 },
        { minAmount: 30100001, rate: 0.12 },
        { minAmount: 28100001, rate: 0.11 },
        { minAmount: 26600001, rate: 0.1 },
        { minAmount: 22700001, rate: 0.09 },
        { minAmount: 19500001, rate: 0.08 },
        { minAmount: 17050001, rate: 0.07 },
        { minAmount: 15550001, rate: 0.06 },
        { minAmount: 14150001, rate: 0.05 },
        { minAmount: 12950001, rate: 0.04 },
        { minAmount: 12050001, rate: 0.03 },
        { minAmount: 11200001, rate: 0.02 },
        { minAmount: 10950001, rate: 0.0175 },
        { minAmount: 9800001, rate: 0.015 },
        { minAmount: 8850001, rate: 0.0125 },
        { minAmount: 7800001, rate: 0.01 },
        { minAmount: 7350001, rate: 0.0075 },
        { minAmount: 6950001, rate: 0.005 },
        { minAmount: 6600001, rate: 0.0025 },
        { minAmount: 0, rate: 0 }
      ];
  }
};
function localise(num) {
  return num.toLocaleString("id-ID", { style: "currency", currency: "IDR" });
}
var TaxpayerStatus;
(function(TaxpayerStatus2) {
  TaxpayerStatus2["TK0"] = "TK/0";
  TaxpayerStatus2["TK1"] = "TK/1";
  TaxpayerStatus2["TK2"] = "TK/2";
  TaxpayerStatus2["TK3"] = "TK/3";
  TaxpayerStatus2["K0"] = "K/0";
  TaxpayerStatus2["K1"] = "K/1";
  TaxpayerStatus2["K2"] = "K/2";
  TaxpayerStatus2["K3"] = "K/3";
})(TaxpayerStatus || (TaxpayerStatus = {}));
var maxBpjskesSubscription = 12000000;
var maxJpSubscription = 9559600;
var TaxRateCategory;
(function(TaxRateCategory2) {
  TaxRateCategory2["A"] = "A";
  TaxRateCategory2["B"] = "B";
  TaxRateCategory2["C"] = "C";
})(TaxRateCategory || (TaxRateCategory = {}));

// src/tax.ts.ts
var salaryInput = document.getElementById("salary");
var bonusInput = document.getElementById("bonus");
var statusInput = document.getElementById("status");
salaryInput.addEventListener("input", (event) => {
  let salary = salaryInput.valueAsNumber;
  if (Number.isNaN(salary))
    salary = 0;
  let bonus = bonusInput.valueAsNumber;
  if (Number.isNaN(bonus))
    bonus = 0;
  const status = toTaxPayerStatus(statusInput.value);
  const result = calculateTax(salary, bonus, status);
  const templateData = {
    salary: localise(salary),
    bonus: localise(bonus),
    employerInsuranceContributionJkk: localise(result.employerInsuranceContribution.jkk),
    employerInsuranceContributionJkm: localise(result.employerInsuranceContribution.jkm),
    employeeInsuranceContributionJht: localise(result.employeeInsuranceContribution.jht * -1),
    employeeInsuranceContributionJp: localise(result.employeeInsuranceContribution.jp * -1),
    employerInsuranceContributionBpjskes: localise(result.employerInsuranceContribution.bpjskes),
    occupationalExpense: localise(result.occupationalExpense * -1),
    netMonthlyIncome: localise(result.netMonthlyIncome),
    netYearlyIncome: localise(result.netYearlyIncome),
    nonTaxableIncome: localise(result.nonTaxableIncome),
    taxableIncome: localise(result.taxableIncome),
    regularMonthTax: localise(result.regularMonthTax),
    bonusMonthTax: localise(result.bonusMonthTax),
    decemberMonthTax: localise(result.decemberMonthTax),
    totalTax: localise(result.totalTax)
  };
  for (const [key, value] of Object.entries(templateData)) {
    const element = document.getElementById(`${key}_value`);
    element.innerHTML = value;
  }
});
