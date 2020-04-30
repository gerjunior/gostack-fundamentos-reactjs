import React, { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';

import income from '../../assets/income.svg';
import outcome from '../../assets/outcome.svg';
import total from '../../assets/total.svg';

import api from '../../services/api';

import Header from '../../components/Header';

import formatValue from '../../utils/formatValue';
import formatDate from '../../utils/formatDate';

import { Container, CardContainer, Card, TableContainer } from './styles';

interface Transaction {
  id: string;
  title: string;
  value: number;
  formattedValue: string;
  formattedDate: string;
  type: 'income' | 'outcome';
  category: { title: string };
  created_at: Date;
}

interface Balance {
  income: string;
  outcome: string;
  total: string;
}

interface Response {
  transactions: Transaction[];
  balance: Balance;
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<Balance>({} as Balance);

  useEffect(() => {
    async function loadTransactions(): Promise<void> {
      api.get<Response>('/transactions').then(response => {
        const formattedTransactions = response.data.transactions.map(
          transaction => {
            const formattedValue = formatValue(transaction.value);
            const formattedDate = formatDate(transaction.created_at);
            return { ...transaction, formattedValue, formattedDate };
          },
        );

        setTransactions(formattedTransactions);
        setBalance(response.data.balance);
      });
    }

    loadTransactions();
  }, []);

  async function handleDelete(id: string): Promise<void> {
    try {
      await api.delete(`transactions/${id}`);

      const [deletedTransaction] = transactions.filter(
        transaction => transaction.id === id,
      );

      setTransactions(
        transactions.filter(transaction => transaction.id !== id),
      );

      const newIncome =
        deletedTransaction.type === 'income'
          ? Number(balance.income) - Number(deletedTransaction.value)
          : Number(balance.income);

      const newOutcome =
        deletedTransaction.type === 'income'
          ? Number(balance.outcome) - Number(deletedTransaction.value)
          : Number(balance.outcome);

      const newTotal = newIncome - newOutcome;

      setBalance({
        income: newIncome.toString(),
        outcome: newOutcome.toString(),
        total: newTotal.toString(),
      });
    } catch (err) {
      console.error(err.message);
    }
  }

  return (
    <>
      <Header />
      <Container>
        <CardContainer>
          <Card>
            <header>
              <p>Entradas</p>
              <img src={income} alt="Income" />
            </header>
            <h1 data-testid="balance-income">
              {formatValue(Number(balance.income))}
            </h1>
          </Card>
          <Card>
            <header>
              <p>Saídas</p>
              <img src={outcome} alt="Outcome" />
            </header>
            <h1 data-testid="balance-outcome">
              {formatValue(Number(balance.outcome))}
            </h1>
          </Card>
          <Card total>
            <header>
              <p>Total</p>
              <img src={total} alt="Total" />
            </header>
            <h1 data-testid="balance-total">
              {formatValue(Number(balance.total))}
            </h1>
          </Card>
        </CardContainer>

        <TableContainer>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Preço</th>
                <th>Categoria</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="title">{transaction.title}</td>
                  <td className={transaction.type}>
                    {transaction.type === 'outcome' && '- '}
                    {transaction.formattedValue}
                  </td>
                  <td>{transaction.category.title}</td>
                  <td>{transaction.formattedDate}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <FiTrash2 size={18} color="#831d1c" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      </Container>
    </>
  );
};

export default Dashboard;
