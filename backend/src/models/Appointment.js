const { query, getClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Armazenamento em memória para desenvolvimento
let memoryStorage = [];

// Inicializar com dados de teste após a definição da classe
setTimeout(() => {
  if (memoryStorage.length === 0 && useMemoryStorage()) {
    // Dados de teste para o dashboard
    const testData = [
      {
        id: 'test-1',
        protocol: '20240128-ABC1',
        customer_name: 'João Silva',
        customer_email: 'joao@email.com',
        customer_phone: '(11) 99999-9999',
        appointment_date: '2024-01-28',
        appointment_time: '09:00',
        duration_minutes: 60,
        notes: 'Corte de cabelo',
        status: 'confirmed',
        created_at: new Date('2024-01-25'),
        updated_at: new Date('2024-01-25')
      },
      {
        id: 'test-2',
        protocol: '20240127-DEF2',
        customer_name: 'Maria Santos',
        customer_email: 'maria@email.com',
        customer_phone: '(11) 88888-8888',
        appointment_date: '2024-01-27',
        appointment_time: '14:00',
        duration_minutes: 60,
        notes: 'Escova',
        status: 'confirmed',
        created_at: new Date('2024-01-24'),
        updated_at: new Date('2024-01-24')
      },
      {
        id: 'test-3',
        protocol: '20240126-GHI3',
        customer_name: 'Pedro Oliveira',
        customer_email: 'pedro@email.com',
        customer_phone: '(11) 77777-7777',
        appointment_date: '2024-01-26',
        appointment_time: '10:00',
        duration_minutes: 60,
        notes: 'Corte de cabelo',
        status: 'confirmed',
        created_at: new Date('2024-01-23'),
        updated_at: new Date('2024-01-23')
      },
      {
        id: 'test-4',
        protocol: '20240125-JKL4',
        customer_name: 'Ana Costa',
        customer_email: 'ana@email.com',
        customer_phone: '(11) 66666-6666',
        appointment_date: '2024-01-25',
        appointment_time: '16:00',
        duration_minutes: 60,
        notes: 'Coloração',
        status: 'confirmed',
        created_at: new Date('2024-01-22'),
        updated_at: new Date('2024-01-22')
      },
      {
        id: 'test-5',
        protocol: '20240124-MNO5',
        customer_name: 'Carlos Lima',
        customer_email: 'carlos@email.com',
        customer_phone: '(11) 55555-5555',
        appointment_date: '2024-01-24',
        appointment_time: '11:00',
        duration_minutes: 60,
        notes: 'Corte de cabelo',
        status: 'confirmed',
        created_at: new Date('2024-01-21'),
        updated_at: new Date('2024-01-21')
      }
    ];

    testData.forEach(data => {
      memoryStorage.push(new Appointment(data));
    });

    console.log('📊 Dados de teste inicializados:', memoryStorage.length, 'agendamentos');
  }
}, 100);

// Verificar se deve usar armazenamento em memória
const useMemoryStorage = () => {
  // Usar armazenamento em memória para desenvolvimento
  return true;
};

class Appointment {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.protocol = data.protocol || this.generateProtocol();
    this.customer_name = data.customer_name;
    this.customer_email = data.customer_email;
    this.customer_phone = data.customer_phone;
    this.appointment_date = data.appointment_date;
    this.appointment_time = data.appointment_time;
    this.duration_minutes = data.duration_minutes || 60;
    this.notes = data.notes;
    this.status = data.status || 'pending';
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
    this.cancelled_at = data.cancelled_at;
    this.cancellation_reason = data.cancellation_reason;
  }

  // Validar dados do agendamento
  static validate(data) {
    const errors = [];

    if (!data.customer_name || data.customer_name.trim().length < 2) {
      errors.push('Nome do cliente é obrigatório e deve ter pelo menos 2 caracteres');
    }

    if (!data.appointment_date) {
      errors.push('Data do agendamento é obrigatória');
    } else {
      const appointmentDate = new Date(data.appointment_date + 'T00:00:00'); // Força horário 00:00
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Comparar apenas AAAA-MM-DD (ignorar horário)
      const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      if (appointmentDateStr < todayStr) {
        errors.push('Data do agendamento não pode ser no passado');
      }
    }

    if (!data.appointment_time) {
      errors.push('Horário do agendamento é obrigatório');
    }

    if (data.duration_minutes && (data.duration_minutes < 15 || data.duration_minutes > 480)) {
      errors.push('Duração deve estar entre 15 e 480 minutos');
    }

    if (data.customer_email && !this.isValidEmail(data.customer_email)) {
      errors.push('Email inválido');
    }

    return errors;
  }

  // Validar formato de email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Gerar protocolo único (formato curto: AG-XXXX onde AG é prefixo e XXXX são 4-6 caracteres alfanuméricos)
  static generateProtocol() {
    // Prefixo fixo para identificação
    const prefix = 'AG';

    // Gerar 4-6 caracteres aleatórios (letras maiúsculas e números, excluindo caracteres confusos)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Sem 0, O, I, 1
    const randomLength = Math.floor(Math.random() * 3) + 4; // 4, 5 ou 6 caracteres

    let randomStr = '';
    for (let i = 0; i < randomLength; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${prefix}-${randomStr}`;
  }

  // Verificar se protocolo já existe (para garantir unicidade)
  static async isProtocolUnique(protocol, excludeId = null) {
    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      const existing = memoryStorage.find(apt =>
        apt.protocol === protocol && (!excludeId || apt.id !== excludeId)
      );
      return !existing;
    } else {
      // Usar PostgreSQL
      const queryText = 'SELECT COUNT(*) as count FROM appointments WHERE protocol = $1 AND ($2::uuid IS NULL OR id != $2)';
      const result = await query(queryText, [protocol, excludeId]);
      return parseInt(result.rows[0].count) === 0;
    }
  }

  // Criar novo agendamento
  static async create(data) {
    const validationErrors = this.validate(data);
    if (validationErrors.length > 0) {
      throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
    }

    // Normalizar data/hora para evitar conflitos falsos por formatação
    const normalizedDate = this.normalizeDate(data.appointment_date);
    const normalizedTime = this.normalizeTime(data.appointment_time);

    // Verificar conflito de horário
    const conflict = await this.checkTimeConflict(
      normalizedDate,
      normalizedTime,
      data.duration_minutes,
      null // excludeId
    );
    if (conflict) {
      throw new Error('Horário indisponível - conflito com outro agendamento');
    }

    // Gerar protocolo único
    let protocol;
    let attempts = 0;
    do {
      protocol = Appointment.generateProtocol();
      attempts++;
      // Limitar tentativas para evitar loop infinito (muito improvável)
      if (attempts > 10) {
        throw new Error('Não foi possível gerar um protocolo único');
      }
    } while (!(await Appointment.isProtocolUnique(protocol)));

    const appointment = new Appointment({
      ...data,
      protocol,
      appointment_date: normalizedDate,
      appointment_time: normalizedTime
    });

    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      memoryStorage.push(appointment);
      console.log('✅ Agendamento criado em memória:', appointment.id);
      return appointment;
    } else {
      // Usar PostgreSQL
      const queryText = `
        INSERT INTO appointments (
          id, protocol, customer_name, customer_email, customer_phone,
          appointment_date, appointment_time, duration_minutes,
          notes, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        appointment.id,
        appointment.protocol,
        appointment.customer_name,
        appointment.customer_email,
        appointment.customer_phone,
        appointment.appointment_date,
        appointment.appointment_time,
        appointment.duration_minutes,
        appointment.notes,
        appointment.status,
        appointment.created_at,
        appointment.updated_at
      ];

      try {
        const result = await query(queryText, values);
        return new Appointment(result.rows[0]);
      } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        throw new Error('Erro ao criar agendamento');
      }
    }
  }

  // Buscar agendamento por ID
  static async findById(id) {
    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      const appointment = memoryStorage.find(apt => apt.id === id);
      return appointment || null;
    } else {
      // Usar PostgreSQL
      const queryText = 'SELECT * FROM appointments WHERE id = $1';
      const result = await query(queryText, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Appointment(result.rows[0]);
    }
  }

  // Buscar agendamento por protocolo (case-insensitive)
  static async findByProtocol(protocol) {
    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      const appointment = memoryStorage.find(apt => apt.protocol.toUpperCase() === protocol.toUpperCase());
      return appointment || null;
    } else {
      // Usar PostgreSQL - busca case-insensitive
      const queryText = 'SELECT * FROM appointments WHERE UPPER(protocol) = UPPER($1)';
      const result = await query(queryText, [protocol]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Appointment(result.rows[0]);
    }
  }

  // Buscar agendamentos com filtros
  static async find(filters = {}) {
    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      let filteredAppointments = [...memoryStorage];

      if (filters.customer_name) {
        const searchTerm = filters.customer_name.toLowerCase();
        filteredAppointments = filteredAppointments.filter(apt =>
          apt.customer_name.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.date) {
        filteredAppointments = filteredAppointments.filter(apt =>
          apt.appointment_date === filters.date
        );
      }

      if (filters.status) {
        filteredAppointments = filteredAppointments.filter(apt =>
          apt.status === filters.status
        );
      }

      if (filters.start_date && filters.end_date) {
        filteredAppointments = filteredAppointments.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          const startDate = new Date(filters.start_date);
          const endDate = new Date(filters.end_date);
          return aptDate >= startDate && aptDate <= endDate;
        });
      }

      // Ordenar por data e horário
      filteredAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateA - dateB;
      });

      return filteredAppointments;
    } else {
      // Usar PostgreSQL
      let queryText = 'SELECT * FROM appointments WHERE 1=1';
      const values = [];
      let paramIndex = 1;

      if (filters.customer_name) {
        queryText += ` AND customer_name ILIKE $${paramIndex}`;
        values.push(`%${filters.customer_name}%`);
        paramIndex++;
      }

      if (filters.date) {
        queryText += ` AND appointment_date = $${paramIndex}`;
        values.push(filters.date);
        paramIndex++;
      }

      if (filters.status) {
        queryText += ` AND status = $${paramIndex}`;
        values.push(filters.status);
        paramIndex++;
      }

      if (filters.start_date && filters.end_date) {
        queryText += ` AND appointment_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        values.push(filters.start_date, filters.end_date);
        paramIndex += 2;
      }

      queryText += ' ORDER BY appointment_date ASC, appointment_time ASC';

      const result = await query(queryText, values);
      return result.rows.map(row => new Appointment(row));
    }
  }

  // Buscar horários disponíveis para uma data
  static async getAvailableSlots(date, duration = 60) {
    let bookedSlots;

    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      bookedSlots = memoryStorage
        .filter(apt => apt.appointment_date === date && apt.status !== 'cancelled')
        .map(apt => ({
          appointment_time: apt.appointment_time,
          duration_minutes: apt.duration_minutes
        }));
    } else {
      // Usar PostgreSQL
      const queryText = `
        SELECT appointment_time, duration_minutes
        FROM appointments
        WHERE appointment_date = $1 AND status != 'cancelled'
        ORDER BY appointment_time ASC
      `;

      const result = await query(queryText, [date]);
      bookedSlots = result.rows;
    }

    // Horário de funcionamento: 8:00 às 18:00
    const workStart = 8 * 60; // 8:00 em minutos
    const workEnd = 18 * 60; // 18:00 em minutos
    const slotDuration = duration;

    const availableSlots = [];
    let currentTime = workStart;

    while (currentTime + slotDuration <= workEnd) {
      const slotStart = currentTime;
      const slotEnd = currentTime + slotDuration;

      // Verificar se há conflito com agendamentos existentes
      const hasConflict = bookedSlots.some(booking => {
        const bookingStart = this.timeToMinutes(booking.appointment_time);
        const bookingEnd = bookingStart + booking.duration_minutes;

        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });

      if (!hasConflict) {
        availableSlots.push({
          time: this.minutesToTime(slotStart),
          duration: slotDuration
        });
      }

      currentTime += 30; // Intervalo de 30 minutos entre slots
    }

    return availableSlots;
  }

  // Verificar conflito de horário
  static async checkTimeConflict(date, time, duration = 60, excludeId = null) {
    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      const normalizedDate = this.normalizeDate(date);
      const normalizedTime = this.normalizeTime(time);

      // Filtrar agendamentos da mesma data e que não estão cancelados
      const sameDateAppointments = memoryStorage.filter(apt => {
        if (apt.status === 'cancelled') return false;
        if (excludeId && apt.id === excludeId) return false;
        const aptDate = this.normalizeDate(apt.appointment_date);
        return aptDate === normalizedDate;
      });

      // Verificar conflitos
      const timeMinutes = this.timeToMinutes(normalizedTime);
      const endTimeMinutes = timeMinutes + (duration || 60);

      for (const apt of sameDateAppointments) {
        const aptTimeMinutes = this.timeToMinutes(this.normalizeTime(apt.appointment_time));
        const aptEndTimeMinutes = aptTimeMinutes + (apt.duration_minutes || 60);

        // Verificar sobreposição: dois intervalos se sobrepõem se
        // início1 < fim2 E fim1 > início2
        if (timeMinutes < aptEndTimeMinutes && endTimeMinutes > aptTimeMinutes) {
          return true;
        }
      }

      return false;
    } else {
      // Usar PostgreSQL
      const queryText = `
        SELECT COUNT(*) as conflict_count
        FROM appointments
        WHERE appointment_date = $1
          AND status != 'cancelled'
          AND id != $4
          AND (
            (appointment_time::time <= $2::time AND (appointment_time::time + (duration_minutes || ' minutes')::interval) > $2::time) OR
            ($2::time <= appointment_time::time AND ($2::time + ($3 || ' minutes')::interval) > appointment_time::time)
          )
      `;

      const params = [date, time, duration, excludeId || null];
      console.log('🔍 Verificando conflitos no banco:', { date, time, duration, excludeId });
      const result = await query(queryText, params);
      const conflictCount = parseInt(result.rows[0].conflict_count);
      console.log('📊 Conflitos encontrados no banco:', conflictCount);
      return conflictCount > 0;
    }
  }

  // Atualizar agendamento
  async update(data) {
    const validationErrors = Appointment.validate({ ...this, ...data });
    if (validationErrors.length > 0) {
      throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
    }

    // Se está mudando data/hora, verificar conflitos
    if ((data.appointment_date && data.appointment_date !== this.appointment_date) ||
        (data.appointment_time && data.appointment_time !== this.appointment_time) ||
        (data.duration_minutes && data.duration_minutes !== this.duration_minutes)) {

      const newDate = Appointment.normalizeDate(data.appointment_date || this.appointment_date);
      const newTime = Appointment.normalizeTime(data.appointment_time || this.appointment_time);
      const newDuration = data.duration_minutes || this.duration_minutes;

      const conflict = await Appointment.checkTimeConflict(newDate, newTime, newDuration, this.id);
      if (conflict) {
        throw new Error('Novo horário indisponível - conflito com outro agendamento');
      }
    }

    // Atualizar campos
    const nextData = { ...data };
    if (nextData.appointment_date) nextData.appointment_date = Appointment.normalizeDate(nextData.appointment_date);
    if (nextData.appointment_time) nextData.appointment_time = Appointment.normalizeTime(nextData.appointment_time);

    Object.assign(this, nextData, { updated_at: new Date() });

    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      const index = memoryStorage.findIndex(apt => apt.id === this.id);
      if (index !== -1) {
        memoryStorage[index] = this;
        console.log('✅ Agendamento atualizado em memória:', this.id);
        return this;
      } else {
        throw new Error('Agendamento não encontrado');
      }
    } else {
      // Usar PostgreSQL
      const queryText = `
        UPDATE appointments SET
          customer_name = $1, customer_email = $2, customer_phone = $3,
          appointment_date = $4, appointment_time = $5, duration_minutes = $6,
          notes = $7, status = $8, updated_at = $9
        WHERE id = $10
        RETURNING *
      `;

      const values = [
        this.customer_name, this.customer_email, this.customer_phone,
        this.appointment_date, this.appointment_time, this.duration_minutes,
        this.notes, this.status, this.updated_at, this.id
      ];

      try {
        const result = await query(queryText, values);
        return new Appointment(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        throw new Error('Erro ao atualizar agendamento');
      }
    }
  }

  // Cancelar agendamento
  async cancel(reason = null) {
    this.status = 'cancelled';
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;
    this.updated_at = new Date();

    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      const index = memoryStorage.findIndex(apt => apt.id === this.id);
      if (index !== -1) {
        memoryStorage[index] = this;
        console.log('✅ Agendamento cancelado em memória:', this.id);
        return this;
      } else {
        throw new Error('Agendamento não encontrado');
      }
    } else {
      // Usar PostgreSQL
      const queryText = `
        UPDATE appointments SET
          status = $1, cancelled_at = $2, cancellation_reason = $3, updated_at = $4
        WHERE id = $5
        RETURNING *
      `;

      const values = [this.status, this.cancelled_at, this.cancellation_reason, this.updated_at, this.id];

      try {
        const result = await query(queryText, values);
        return new Appointment(result.rows[0]);
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        throw new Error('Erro ao cancelar agendamento');
      }
    }
  }

  // Deletar agendamento
  async delete() {
    if (useMemoryStorage()) {
      // Usar armazenamento em memória
      const index = memoryStorage.findIndex(apt => apt.id === this.id);
      if (index !== -1) {
        memoryStorage.splice(index, 1);
        console.log('✅ Agendamento deletado em memória:', this.id);
        return true;
      } else {
        throw new Error('Agendamento não encontrado');
      }
    } else {
      // Usar PostgreSQL
      const queryText = 'DELETE FROM appointments WHERE id = $1';
      await query(queryText, [this.id]);
      return true;
    }
  }

  // Converter tempo para minutos
  static timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Normalizar data em YYYY-MM-DD
  static normalizeDate(value) {
    if (!value) return value;

    // Se já está em YYYY-MM-DD, manter
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // Aceitar ISO (YYYY-MM-DDTHH:mm...) e Date
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return value;

    // Usar UTC para evitar deslocamento de fuso ao serializar
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Normalizar hora em HH:MM
  static normalizeTime(value) {
    if (!value) return value;
    if (typeof value !== 'string') return value;
    const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return value;
    const hh = String(parseInt(match[1], 10)).padStart(2, '0');
    const mm = match[2];
    return `${hh}:${mm}`;
  }

  // Converter minutos para tempo
  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Serializar para JSON
  toJSON() {
    return {
      id: this.id,
      protocol: this.protocol,
      customer_name: this.customer_name,
      customer_email: this.customer_email,
      customer_phone: this.customer_phone,
      appointment_date: this.appointment_date,
      appointment_time: this.appointment_time,
      duration_minutes: this.duration_minutes,
      notes: this.notes,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      cancelled_at: this.cancelled_at,
      cancellation_reason: this.cancellation_reason
    };
  }
}

module.exports = Appointment;



