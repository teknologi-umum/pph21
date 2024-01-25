import type { Context } from "@stricjs/app"
import { routes } from "@stricjs/app"
import Mustache from "mustache"
import { calculateTax, toTaxPayerStatus } from "./tax"
import { file, head, html } from "@stricjs/app/send";
import wsRoute from "./hmr.ws.ts";

let template = await Bun.file(import.meta.dir + "/index.html").text();

export default routes()
	.get("/styles.css", getCssHandler)
	.get('/__hmr', (c) => wsRoute.upgrade(c))
	.get('/', getHandler)
	.post('/', postHandler)

function getCssHandler(_: Context) {
	return file(import.meta.dir + "/styles.css");
}

async function getHandler(_: Context) {
	// load latest template if in development mode
	if (import.meta.env.MODE === "development") {
		template = await Bun.file(import.meta.dir + "/index.html").text()
	}
	return html(Mustache.render(template, {
		development: import.meta.env.MODE === "development",
	}));
}

function localise(num: number) {
	return num.toLocaleString("id-ID", { style: "currency", currency: "IDR" })
}

async function postHandler(context: Context) {
	const formData = await context.req.formData()
	const rawStatus = formData.get("status")
	const rawSalary = formData.get("salary")
	const rawBonus = formData.get("bonus")

	if (rawStatus === null) return head({ status: 400 });

	const taxpayerStatus = toTaxPayerStatus(rawStatus.toString())

	const salary = Number(rawSalary)
	if (Number.isNaN(salary)) return head({ status: 400 });

	const bonus = Number(rawBonus)
	if (Number.isNaN(bonus)) return head({ status: 400 });

	const result = calculateTax(salary, bonus, taxpayerStatus)
	const templateData = {
		salary: salary.toLocaleString("id-ID", { style: "currency", currency: "IDR" }),
		bonus: bonus.toLocaleString("id-ID", { style: "currency", currency: "IDR" }),
		taxRateCategory: result.taxRateCategory,
		employerInsuranceContributionJkk: localise(result.employerInsuranceContribution.jkk),
		employerInsuranceContributionJkm: localise(result.employerInsuranceContribution.jkm),
		employeeInsuranceContributionJht: localise(result.employeeInsuranceContribution.jht),
		employeeInsuranceContributionJp: localise(result.employeeInsuranceContribution.jp),
		employerInsuranceContributionBpjskes: localise(result.employerInsuranceContribution.bpjskes),
		occupationalExpense: localise(result.occupationalExpense),
		netMonthlyIncome: localise(result.netMonthlyIncome),
		netYearlyIncome: localise(result.netYearlyIncome),
		nonTaxableIncome: localise(result.nonTaxableIncome),
		taxableIncome: localise(result.taxableIncome),
		regularMonthTax: localise(result.regularMonthTax),
		bonusMonthTax: localise(result.bonusMonthTax),
		decemberMonthTax: localise(result.decemberMonthTax),
		totalTax: localise(result.totalTax),
		development: import.meta.env.MODE === "development",
	}

	// load latest template if in development mode
	if (import.meta.env.MODE === "development") {
		template = await Bun.file(import.meta.dir + "/index.html").text()
	}
	return html(Mustache.render(template, templateData))
}
