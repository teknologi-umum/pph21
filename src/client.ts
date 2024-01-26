import { calculateTax, localise, toTaxPayerStatus } from "./tax.ts";

const salaryInput = document.getElementById('salary') as HTMLInputElement;
const bonusInput = document.getElementById('bonus') as HTMLInputElement;
const statusInput = document.getElementById('status') as HTMLSelectElement;

salaryInput.addEventListener('input', (event) => {
		let salary = salaryInput.valueAsNumber;
		if (Number.isNaN(salary)) salary = 0;
		let bonus = bonusInput.valueAsNumber;
		if (Number.isNaN(bonus)) bonus = 0;
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
			totalTax: localise(result.totalTax),
		}

		for (const [key, value] of Object.entries(templateData)) {
			const element = document.getElementById(`${key}_value`) as HTMLInputElement;
			element.innerHTML = value;
		}
	}
)