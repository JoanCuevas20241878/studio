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

  if (!monthlyBudgetLimit || monthlyBudgetLimit <= 0) {
    return {
      alerts: [],
      recommendations: [t.aiTipsPlaceholder]
    };
  }

  const spendingPercentage = (totalSpentThisMonth / monthlyBudgetLimit) * 100;
  const sortedCategories = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);

  // --- Generate Alerts ---
  if (spendingPercentage > 100) {
    alerts.push((t.overBudgetAlert || 'Has superado tu presupuesto en un {percent}%.').replace('{percent}', Math.round(spendingPercentage - 100).toString()));
  } else if (spendingPercentage > 85) {
    alerts.push((t.budgetWarningAlert || 'Has gastado más del 85% de tu presupuesto.').replace('{percent}', '85'));
  }

  if (sortedCategories.length > 0) {
    const topCategory = sortedCategories[0][0];
    const topCategoryAmount = sortedCategories[0][1];
    const topCategoryPercentage = (topCategoryAmount / totalSpentThisMonth) * 100;

    if (topCategoryPercentage > 60) {
        alerts.push((t.highConcentrationAlert || 'Tu gasto principal en "{category}" representa un {percent}% del total. Considera diversificar.').replace('{category}', t[topCategory.toLowerCase()] || topCategory).replace('{percent}', Math.round(topCategoryPercentage).toString()));
    }
  }

  // --- Generate Recommendations ---
  if (sortedCategories.length > 0) {
    sortedCategories.forEach(([category, amount]) => {
      const categoryPercentage = (amount / totalSpentThisMonth) * 100;
      if (category === 'Food' && categoryPercentage > 30) {
        recommendations.push(t.foodRecommendation || 'Has gastado un {percent}% en comida. Para reducir este gasto, intenta planificar tus comidas semanales y aprovecha ofertas en supermercados.'.replace('{percent}', Math.round(categoryPercentage).toString()));
      }
      if (category === 'Transport' && categoryPercentage > 25) {
        recommendations.push(t.transportRecommendation || 'Tu gasto en transporte es del {percent}%. Considera usar transporte público, bicicleta o compartir coche para ahorrar.'.replace('{percent}', Math.round(categoryPercentage).toString()));
      }
      if (category === 'Clothing' && categoryPercentage > 20) {
        recommendations.push(t.clothingRecommendation || 'Un {percent}% de tus gastos es en ropa. Busca ofertas de fin de temporada o explora tiendas de segunda mano.'.replace('{percent}', Math.round(categoryPercentage).toString()));
      }
    });
  }

  if (spendingPercentage < 50) {
    const savings = monthlyBudgetLimit / 2 - totalSpentThisMonth;
    recommendations.push((t.lowSpendingRecommendation || '¡Vas muy bien! Has gastado menos de la mitad de tu presupuesto. Podrías invertir unos ${amount} y aun así mantener un colchón.').replace('{amount}', Math.round(savings).toString()));
  } else {
    recommendations.push(t.generalRecommendation || 'Revisa tus suscripciones mensuales (streaming, apps, etc.). A menudo hay servicios que ya no usas y que puedes cancelar para un ahorro fácil.');
  }

  if (recommendations.length === 0 && alerts.length === 0) {
    recommendations.push(t.goodJobRecommendation || '¡Excelente trabajo! Tus gastos están bien equilibrados este mes. ¡Sigue así!');
  }

  // Ensure no more than 2 recommendations to keep it clean
  return { alerts, recommendations: recommendations.slice(0, 2) };
}
