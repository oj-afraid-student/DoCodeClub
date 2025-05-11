def judge_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

def main():
    print("Hello, DoCodeClub!")
    num = int(input("请输入一个正整数: "))
    if judge_prime(num):
        print(f"{num}是一个质数")
    else:
        print(f"{num}是一个合数")

main()