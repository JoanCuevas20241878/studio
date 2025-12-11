import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) {
    return;
  }

  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date
          ? cell.toLocaleString()
          : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// A simple debounce function
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}

type SavingsTipsInput = {
  totalSpentThisMonth: number;
  monthlyBudgetLimit: number;
  expensesByCategory: { [key: string]: number };
  t: any; // Translation function/object
};

type SavingsTipsOutput = {
  alerts: string[];
  recommendations: string[];
};

export function getLocalSavingsTips(input: SavingsTipsInput): SavingsTipsOutput {
  const { totalSpentThisMonth, monthlyBudgetLimit, expensesByCategory, t } = input;
  const alerts: string[] = [];
  const recommendations: string[] = [];

  if (!monthlyBudgetLimit || monthlyBudgetLimit === 0) {
    return {
      alerts: [],
      recommendations: [t.aiTipsPlaceholder]
    };
  }

  // --- Generate Alerts ---
  const spendingPercentage = (totalSpentThisMonth / monthlyBudgetLimit) * 100;
  if (spendingPercentage > 100) {
    alerts.push(t.overBudgetAlert || `Has superado tu presupuesto en un ${Math.round(spendingPercentage - 100)}%.`);
  } else if (spendingPercentage > 85) {
    alerts.push(t.budgetWarningAlert || `Has gastado más del 85% de tu presupuesto.`);
  }

  for (const category in expensesByCategory) {
    const categorySpendingPercentage = (expensesByCategory[category] / totalSpentThisMonth) * 100;
    if (categorySpendingPercentage > 50) {
      alerts.push(t.categoryConcentrationAlert || `Más del 50% de tus gastos están en la categoría '${t[category.toLowerCase()] || category}'.`);
    }
  }
  
  // --- Generate Recommendations ---
  const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);

  if (sortedCategories.length > 0) {
    const topCategory = sortedCategories[0][0];
    if (topCategory === 'Food') {
        recommendations.push(t.foodRecommendation || 'Intenta planificar las comidas de la semana o busca descuentos en supermercados para reducir los gastos en comida.');
    } else if (topCategory === 'Transport') {
        recommendations.push(t.transportRecommendation || 'Considera usar el transporte público, la bicicleta o compartir coche para ahorrar en transporte.');
    } else if (topCategory === 'Clothing') {
        recommendations.push(t.clothingRecommendation || 'Busca ofertas de fin de temporada o considera tiendas de segunda mano para tus compras de ropa.');
    }
  }

  if (totalSpentThisMonth < monthlyBudgetLimit / 2) {
    recommendations.push(t.lowSpendingRecommendation || '¡Vas muy bien con tus gastos! Considera guardar una parte de lo que estás ahorrando.');
  } else {
    recommendations.push(t.generalRecommendation || 'Revisa tus suscripciones mensuales. A menudo hay servicios que ya no usas y que puedes cancelar.');
  }
  
  if (recommendations.length === 0 && alerts.length === 0) {
    recommendations.push(t.goodJobRecommendation || '¡Excelente trabajo! Tus gastos están bien equilibrados. Sigue así.');
  }

  return { alerts, recommendations };
}

