import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { CustomerAgent } from 'src/core/repository/customer-agent/customer-agent.entity';
import { CUSTOMER_AGENT_REPOSITORY } from 'src/core/repository/customer-agent/customer-agent.module';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { MessageEntity } from 'src/core/repository/message/message.entity';
import { UserJobEntity } from 'src/core/repository/user-job/user-job.entity';
import { USER_JOB_REPOSITORY } from 'src/core/repository/user-job/user-job.module';
import { Role, UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Between, In, Repository } from 'typeorm';
import {
  ChangeSalesPasswordDto,
  DeleteUserRequest,
  UpdateUserRequestDto,
} from '../user.dto';

@Injectable()
export class ManageUserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
    @Inject(CUSTOMER_AGENT_REPOSITORY)
    private customerAgentRepository: Repository<CustomerAgent>,
    @Inject(USER_JOB_REPOSITORY)
    private userJobRepository: Repository<UserJobEntity>,
  ) {}

  async updateUser(agentId: number, newData: UpdateUserRequestDto) {
    let user = await this.userRepository.findOneOrFail({
      where: {
        id: agentId,
      },
    });

    user.full_name = newData.full_name;
    user.email = newData.email;
    user.username = newData.username;
    user.role = newData.role;

    user = await this.userRepository.save(user);
    return <ApiResponse<UserEntity>>{
      success: true,
      data: user,
      message: 'Success update user data with id ' + agentId,
    };
  }

  async changeSalesPassword(request: ChangeSalesPasswordDto, agentId: number) {
    const agent = await this.userRepository.findOneOrFail({
      where: {
        id: agentId,
      },
    });

    const newHashedPassword = await hash(request.newPassword, 10);
    agent.password = newHashedPassword;

    await this.userRepository.save(agent);
    return <ApiResponse<UserEntity>>{
      success: true,
      data: agent,
      message: 'Password changed',
    };
  }

  async getStats(id: number, start: string, end: string) {
    const dateStart = new Date(start);
    dateStart.setHours(0);
    dateStart.setHours(0);

    const dateEnd = new Date(end);
    dateEnd.setHours(23);
    dateEnd.setMinutes(59);

    const userWithMessages = await this.userRepository.findOne({
      where: {
        id: id,
        customer: {
          customer: {
            messages: {
              created_at: Between(dateStart, dateEnd),
            },
          },
        },
      },
      relations: {
        customer: {
          customer: {
            messages: {
              agent: true,
            },
          },
        },
      },
      order: {
        customer: {
          customer: {
            id: 'ASC',
            messages: {
              id: 'ASC',
            },
          },
        },
      },
    });

    if (userWithMessages == null) {
      throw new NotFoundException(
        'Not found report from id ' +
          id +
          ' with date ' +
          dateStart.toDateString() +
          ' to ' +
          dateEnd.toDateString(),
      );
    }

    const customers = userWithMessages.customer.map((item) => item.customer);

    const newCustomers = [...customers]
      .filter(
        (customer) =>
          customer.created_at >= dateStart && customer.customerCrmId === null,
      )
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      }));

    const result = customers.map((customer) => {
      //pisah berdasarkan tanggal
      const dateMessagesGroup = this.groupingByDate(customer);
      const responseTimes = dateMessagesGroup.map((item) => {
        //cari response time pada tanggal sekian
        const responseTime = this.calculateDailyResponseTime(item);
        return responseTime;
      });

      const allResponseTime: number[] = [];
      responseTimes.forEach((item) => {
        item.responseTimes.forEach((itemJ) => {
          allResponseTime.push(itemJ.seconds);
        });
      });
      const avgAllResponseTime =
        allResponseTime.length > 0
          ? allResponseTime.reduce((prev, cur) => prev + cur) /
            allResponseTime.length
          : 0;

      const allUnreadMessagesCount: number =
        responseTimes.length > 0
          ? responseTimes
              .map((item) => item.unread_message)
              .reduce((prev, value) => prev + value)
          : 0;

      const answeredMessages = allResponseTime.length;

      return {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        answered_messages: answeredMessages,
        average_all_response_time: avgAllResponseTime,
        all_unread_message_count: allUnreadMessagesCount,
        dailyReport: responseTimes,
      };
    });

    const allResponseTime = result.map(
      (item) => item.average_all_response_time,
    );

    const avgResponseTime =
      allResponseTime.reduce((prev, cur) => prev + cur) / result.length;

    const lateAnswerCount = result.map((item) => item.all_unread_message_count);

    const userEntity = {
      id: userWithMessages.id,
      full_name: userWithMessages.full_name,
      username: userWithMessages.username,
      email: userWithMessages.email,
      role: userWithMessages.role,
      late_answer_count: lateAnswerCount,
      average_response_time: avgResponseTime,
      created_at: userWithMessages.created_at,
      updated_at: userWithMessages.updated_at,
      statistics: result,
      newCustomers: newCustomers,
    };

    return userEntity;
  }

  private calculateDailyResponseTime(
    dateMessage: DateMessages,
    // agentId: number,
  ) {
    const messages = dateMessage.messages;
    const responseTimes: ResponseTime[] = [];
    let unreadMessageCount = 0;
    let lateResponseCount = 0;

    let customerFirstQuestionIndex = -1;
    messages.forEach((message, index) => {
      //jika customer bertanya
      if (!message.fromMe) {
        //jika tidak ada pertanyaan sebelumnya
        if (customerFirstQuestionIndex == -1) {
          customerFirstQuestionIndex = index;
        }
        //jika jam tersebut termasuk jam kerja
        if (
          message.created_at.getHours() >= 8 &&
          message.created_at.getHours() < 21
        ) {
          unreadMessageCount++;
        }
      }
      //jika dijawab sales, maka jalan kode dibawah ini

      //jika pesan sebelumnya bukan dari aloha, maka dianggap menjawab pesan
      else if (
        // index lebih dari 0 untuk cek sebelumnya
        index > 0 &&
        // //pesan sebelumnya dari sales
        // !messages[index - 1].fromMe &&

        //jika ada pertanyaan
        customerFirstQuestionIndex > -1 &&
        //pesannya dari sales tersebut
        message.agent !== null &&
        message.agent.role !== Role.sistem
      ) {
        const customerQuestionDate = Math.abs(
          messages[customerFirstQuestionIndex].created_at.getTime() / 1000,
        );
        const salesReplyDate = Math.abs(
          messages[index].created_at.getTime() / 1000,
        );

        //hitung response time
        const responseTime = salesReplyDate - customerQuestionDate;

        //jika lebih dari 600 detik / 10 menit maka dianggap telat
        if (responseTime > 600) {
          lateResponseCount++;
        }

        responseTimes.push({
          question:
            messages[customerFirstQuestionIndex].message.length != 0
              ? messages[customerFirstQuestionIndex].message
              : '(' + messages[customerFirstQuestionIndex].type + ')',
          answer: messages[index].message,
          formattedString: this.formatResponseTime(responseTime),
          seconds: responseTime,
        });

        //reset counter jika sudah dijawab
        unreadMessageCount = 0;
        customerFirstQuestionIndex = -1;
      }
    });

    //hitung rata2 response time
    const responseTimeAvg =
      responseTimes.length > 0
        ? responseTimes
            .map((time) => time.seconds)
            .reduce((prev, cur) => prev + cur) / responseTimes.length
        : 0;

    return <DailyResponseTimeResult>{
      date: dateMessage.date,
      average: responseTimeAvg,
      late_response: lateResponseCount,
      unread_message: unreadMessageCount,
      responseTimes: responseTimes,
    };
  }

  private formatResponseTime(responseTime: number) {
    //format ke jam:menit:detik
    const responseTimeHours = Math.floor(responseTime / 3600);
    const responseTimeMinutes = Math.floor((responseTime % 3600) / 60);
    const responseTimeSeconds = responseTime % 60;
    const formattedResponseTime =
      responseTimeHours.toString() +
      ' jam, ' +
      responseTimeMinutes.toString() +
      ' menit, ' +
      Math.round(responseTimeSeconds).toString() +
      ' detik';
    return formattedResponseTime;
  }

  private groupingByDate(customer: CustomerEntity) {
    const messages = customer.messages;
    const result: DateMessages[] = [];

    const getFormattedDate = (message: MessageEntity) => {
      const date = message.created_at.getDate();
      const month = message.created_at.getMonth() + 1;
      const year = message.created_at.getFullYear();
      const formattedDate = `${date}/${month}/${year}`;
      return formattedDate;
    };

    messages.forEach((message) => {
      const formattedDate = getFormattedDate(message);
      const dateIndex = result.findIndex((date) => date.date == formattedDate);
      if (dateIndex == -1) {
        if (message.fromMe) {
          return;
        }
        const messageWithDate = <DateMessages>{
          date: formattedDate,
          messages: [message],
        };
        result.push(messageWithDate);
      } else {
        result[dateIndex].messages.push(message);
      }
    });
    return result;
  }

  async deleteUser(request: DeleteUserRequest) {
    const sales = await this.userRepository.findOne({
      where: {
        id: request.salesId,
      },
    });

    if (request.delegatedSalesId === request.salesId) {
      throw new BadRequestException(
        'Sales ID yang dihapus sama dengan yang didelegasi',
      );
    }

    if (sales === null) {
      throw new NotFoundException(
        'Sales with id ' + request.salesId + ' not found',
      );
    }

    //delegate all customer to new sales
    const delegatedSales = await this.userRepository.findOne({
      where: {
        id: request.delegatedSalesId,
      },
    });

    if (delegatedSales === null) {
      throw new NotFoundException(
        'Delegated sales with id ' + request.salesId + ' not found',
      );
    }

    //ambil customer yang ada di sales yang akan dihapus dan yang akan didelegasikan
    const customers = await this.customerAgentRepository.find({
      where: {
        agent: {
          id: In([sales.id, delegatedSales.id]),
        },
      },
      relations: {
        agent: true,
        customer: true,
      },
    });

    const salesCustomer: CustomerAgent[] = customers.filter(
      (value) => value.agent.id === sales.id,
    );
    const delegatedSalesCustomers: CustomerAgent[] = customers.filter(
      (value) => value.agent.id === delegatedSales.id,
    );

    for (const customer of salesCustomer) {
      //jika delegated sales nya sudah handle si customer itu
      if (
        delegatedSalesCustomers.find(
          (value) => value.customer.id === customer.customer.id,
        ) !== undefined
      ) {
        await this.customerAgentRepository.delete(customer.id);
      } else {
        customer.agent = delegatedSales;
        delegatedSalesCustomers.push(customer);
      }
    }

    await this.customerAgentRepository.save(delegatedSalesCustomers);

    //hapus job
    const userJob = await this.userJobRepository.find({
      where: {
        agent: {
          id: sales.id,
        },
      },
      relations: {
        agent: true,
      },
    });

    if (userJob.length > 0) {
      await this.userJobRepository.delete(userJob.map((e) => e.id));
    }

    sales.movedTo = request.delegatedSalesId;

    await this.userRepository.save(sales);

    await this.userRepository.softDelete(sales.id);

    return <ApiResponse<any>>{
      success: true,
      data: await this.userRepository.findOne({
        where: {
          id: delegatedSales.id,
        },
        relations: {
          customer: {
            customer: true,
          },
        },
      }),
      message:
        'Sukses menghapus sales ' +
        sales.full_name +
        ' dan mendelegasikan semua customer ke sales ' +
        delegatedSales.full_name,
    };
  }

  async deactivateUser(id: number) {
    const sales = await this.userJobRepository.find({
      where: {
        agent: {
          id: id,
        },
      },
      relations: {
        agent: true,
      },
    });

    if (sales.length > 0) {
      await this.userJobRepository.delete(sales.map((value) => value.id));
    }

    const newSales = await this.userRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        job: {
          job: true,
        },
      },
    });

    return <ApiResponse<any>>{
      success: true,
      data: newSales,
      message: 'Sukses mendeaktifkan sales ' + newSales?.full_name,
    };
  }
}

type DateMessages = {
  date: string;
  messages: MessageEntity[];
};

type ResponseTime = {
  question: string;
  answer: string;
  formattedString: string;
  seconds: number;
};

type DailyResponseTimeResult = {
  date: string;
  average: number;
  unread_message: number;
  late_response: number;
  responseTimes: ResponseTime[];
};

export type UserEntityType = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  profile_photo: string;
  created_at: Date;
  updated_at: Date;
};
