import dayjs from 'dayjs'

type DateType = string | number | Date

export const convertToJSDate = (time: DateType) => new Date(time)

export const convertToDateTime = (time: DateType) => {
  time = convertToJSDate(time)

  return dayjs(time).format('YYYY/MM/DD HH:mm:ss')
}

export const sleep = (time: number) =>
  new Promise((res) => setTimeout(res, time))
