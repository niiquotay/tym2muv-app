
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { useLocation } from '../context/LocationContext';
import { getSymbolFromCode } from '../services/location';

interface MortgageCalculatorProps {
  price: number;
  currency?: string;
}

const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ price, currency }) => {
  const [downPayment, setDownPayment] = useState(price * 0.2);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const { userLocation } = useLocation();

  useEffect(() => {
    const principal = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    if (monthlyRate === 0) {
      setMonthlyPayment(principal / numberOfPayments);
    } else {
      const payment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      setMonthlyPayment(payment);
    }
  }, [price, downPayment, interestRate, loanTerm]);

  const currencySymbol = getSymbolFromCode(currency || (userLocation.countryCode === 'GH' ? 'GHS' : userLocation.countryCode === 'NG' ? 'NGN' : 'USD'));

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
          <Icon name="dollarSign" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Mortgage Calculator</h3>
          <p className="text-xs text-slate-500">Estimate your monthly payments</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Down Payment</label>
            <span className="text-xs font-bold text-slate-900">{currencySymbol}{downPayment.toLocaleString()}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max={price} 
            step={1000}
            value={downPayment} 
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interest Rate (%)</label>
            <input 
              type="number" 
              value={interestRate} 
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Loan Term (Years)</label>
            <select 
              value={loanTerm} 
              onChange={(e) => setLoanTerm(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value={15}>15 Years</option>
              <option value={20}>20 Years</option>
              <option value={30}>30 Years</option>
            </select>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">Estimated Monthly</span>
            <div className="text-right">
              <span className="text-2xl font-black text-brand-600">{currencySymbol}{Math.round(monthlyPayment).toLocaleString()}</span>
              <span className="text-[10px] block text-slate-400">Principal & Interest</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
