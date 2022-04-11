import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { CustomerEntity } from 'src/core/repository/customer/customer.entity';
import { MessageEntity } from 'src/core/repository/message/message.entity';
import { UserEntity } from 'src/core/repository/user/user.entity';
import { USER_REPOSITORY } from 'src/core/repository/user/user.module';
import { ApiResponse } from 'src/utils/apiresponse.dto';
import { Repository } from 'typeorm';
import { ChangeSalesPasswordDto, UpdateUserRequestDto } from '../user.dto';

@Injectable()
export class ManageUserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: Repository<UserEntity>,
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

  async getStats(id: number) {
    const userWithMessages = await this.userRepository.findOneOrFail({
      where: {
        id: id,
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
            messages: {
              created_at: 'ASC',
            },
          },
        },
      },
    });
    const customers = userWithMessages.customer.map((item) => item.customer);

    const result = customers.map((customer) => {
      //pisah berdasarkan tanggal
      const dateMessagesGroup = this.groupingByDate(customer);
      const responseTimes = dateMessagesGroup.map((item) => {
        //cari response time pada tanggal sekian
        const responseTime = this.calculateResponseTime(item, id);
        //hitung rata2 response time
        const responseTimeAvg =
          responseTime.responseTimes.length > 0
            ? responseTime.responseTimes
                .map((time) => time.seconds)
                .reduce((prev, cur) => prev + cur) /
              responseTime.responseTimes.length
            : 0;

        return <DailyResponseTimeResult>{
          date: item.date,
          avg: responseTimeAvg,
          unread_message_count: responseTime.unread_message_count,
          responseTimes: responseTime.responseTimes,
        };
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

      const allUnreadMessagesCount: number[] = [];
      responseTimes.forEach((item) => {
        allUnreadMessagesCount.push(item.unread_message_count);
      });

      const avgAllUnreadMessagesCount =
        allUnreadMessagesCount.length > 0
          ? allUnreadMessagesCount.reduce((prev, value) => prev + value)
          : 0;

      return {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        average_all_response_time: avgAllResponseTime,
        all_unread_message_count: avgAllUnreadMessagesCount,
        responseTime: responseTimes,
      };
    });

    // yang di cek yang jam kerja aja
    // messages = messages.filter(
    //   (message) =>
    //     message.created_at.getHours() >= 8 &&
    //     message.created_at.getHours() <= 16,
    // );
    //untuk demo, pake chat nya arik aja
    return result;
  }

  private calculateResponseTime(dateMessage: DateMessages, agentId: number) {
    const messages = dateMessage.messages;
    const responseTimes: ResponseTime[] = [];
    let unreadMessageCount = 0;

    let customerFirstQuestionIndex = -1;
    messages.forEach((message, index) => {
      //jika customer bertanya
      if (!message.fromMe) {
        if (customerFirstQuestionIndex == -1) {
          customerFirstQuestionIndex = index;
        }
        unreadMessageCount++;
      }
      //jika dijawab sales, maka jalan kode dibawah ini

      //jika pesan sebelumnya bukan dari aloha, maka dianggap menjawab pesan
      else if (
        index != 0 &&
        !messages[index - 1].fromMe &&
        message.agent !== null &&
        message.agent.id == agentId
      ) {
        const customerQuestionDate = Math.abs(
          messages[customerFirstQuestionIndex].created_at.getTime() / 1000,
        );
        const salesReplyDate = Math.abs(
          messages[index].created_at.getTime() / 1000,
        );

        const responseTime = salesReplyDate - customerQuestionDate;
        const responseTimeHours = Math.floor(responseTime / 3600);
        const responseTimeMinutes = Math.floor((responseTime % 3600) / 60);
        const responseTimeSeconds = responseTime % 60;
        const formattedResponseTime = `${responseTimeHours}:${responseTimeMinutes}:${responseTimeSeconds}`;

        responseTimes.push({
          formattedString: formattedResponseTime,
          seconds: responseTime,
        });
        unreadMessageCount = 0;
        customerFirstQuestionIndex = -1;
      }
    });

    return <CalculateResponseTimeResult>{
      unread_message_count: unreadMessageCount,
      responseTimes: responseTimes,
    };
  }

  private groupingByDate(customer: CustomerEntity) {
    const messages = customer.messages;
    const result: DateMessages[] = [];

    const getFormattedDate = (message: MessageEntity) => {
      const date = message.created_at.getDate();
      const month = message.created_at.getMonth();
      const year = message.created_at.getFullYear();
      const formattedDate = `${date}/${month}/${year}`;
      return formattedDate;
    };

    messages.forEach((message) => {
      const formattedDate = getFormattedDate(message);
      const dateIndex = result.findIndex((date) => date.date == formattedDate);
      if (dateIndex == -1) {
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
}

type DateMessages = {
  date: string;
  messages: MessageEntity[];
};

type ResponseTime = {
  formattedString: string;
  seconds: number;
};

type CalculateResponseTimeResult = {
  unread_message_count: number;
  responseTimes: ResponseTime[];
};

type DailyResponseTimeResult = {
  date: string;
  avg: number;
  unread_message_count: number;
  responseTimes: ResponseTime[];
};
